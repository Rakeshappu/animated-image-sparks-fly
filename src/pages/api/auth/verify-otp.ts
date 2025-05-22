
import type { NextApiRequest, NextApiResponse } from 'next';
import { User } from '../../../lib/db/models/User';
import connectDB from '../../../lib/db/connect';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { email, otp, purpose } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if the OTP is correct and not expired
    if (user.verificationCode !== otp) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    if (!user.verificationCodeExpiry || new Date() > user.verificationCodeExpiry) {
      return res.status(400).json({ error: 'Verification code has expired' });
    }

    // Handle purpose-specific logic
    if (purpose === 'resetPassword') {
      // For reset password, just verify the OTP but don't clear it yet
      // It will be cleared when the actual password reset happens
      console.log('OTP verified for password reset:', email);
      return res.status(200).json({ 
        success: true, 
        message: 'Verification code verified. You can now reset your password.' 
      });
    } else {
      // For email verification or other purposes
      user.isEmailVerified = true;
      user.verificationCode = undefined;
      user.verificationCodeExpiry = undefined;
      await user.save();

      console.log('Email verified for user:', email);
      return res.status(200).json({ 
        success: true, 
        message: 'Email verified successfully' 
      });
    }
  } catch (error) {
    console.error('OTP verification error:', error);
    return res.status(500).json({ error: 'Failed to verify OTP' });
  }
}
