
import type { NextApiRequest, NextApiResponse } from 'next';
import { User } from '../../../lib/db/models/User';
import connectDB from '../../../lib/db/connect';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { email, otp, purpose } = req.body;
    console.log('Received verification request:', { email, otp, purpose });
    
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    console.log('Searching for user with criteria:', {
      email,
      verificationCode: otp,
      verificationCodeExpiry: { $gt: new Date() }
    });

    // Find user by email first
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('User found:', {
      email: user.email,
      verificationCode: user.verificationCode,
      verificationCodeExpiry: user.verificationCodeExpiry,
      currentTime: new Date()
    });

    // Check if the OTP is valid and not expired
    if (user.verificationCode !== otp) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }
    
    if (!user.verificationCodeExpiry || new Date() > user.verificationCodeExpiry) {
      return res.status(400).json({ error: 'Verification code has expired' });
    }

    // If verification is for password reset, just return success
    if (purpose === 'resetPassword') {
      console.log('Valid OTP for password reset purpose');
      return res.status(200).json({
        success: true,
        message: 'OTP verified successfully'
      });
    }

    // For email verification, update user status
    user.isEmailVerified = true;
    
    // Don't clear verification code for password reset purpose
    if (purpose !== 'resetPassword') {
      user.verificationCode = undefined;
      user.verificationCodeExpiry = undefined;
    }
    
    await user.save();
    console.log('Email verification successful for:', email);

    res.status(200).json({ 
      success: true,
      message: 'Email verified successfully',
      isAdminVerified: user.isAdminVerified,
      requiresAdminVerification: true,
      role: user.role
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'Internal server error', details: String(error) });
  }
}
