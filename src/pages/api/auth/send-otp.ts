
import type { NextApiRequest, NextApiResponse } from 'next';
import { User } from '../../../lib/db/models/User';
import { generateOTP } from '../../../lib/auth/otp';
import { sendVerificationEmail, sendPasswordResetEmail } from '../../../lib/email/sendEmail';
import connectDB from '../../../lib/db/connect';
import { verifyEmailConfig } from '../../../lib/email/config';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
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
    // Verify email configuration
    const emailConfigStatus = await verifyEmailConfig();
    if (!emailConfigStatus) {
      console.error('Email configuration is invalid');
      return res.status(500).json({ error: 'Email service configuration failed' });
    }

    // Connect to database
    await connectDB();
    
    const { email, purpose } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    console.log('Generating new OTP for:', email, 'Purpose:', purpose || 'emailVerification');
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    console.log('New OTP generated:', otp, 'Expiry:', otpExpiry);

    const user = await User.findOneAndUpdate(
      { email }, 
      { 
        verificationCode: otp, 
        verificationCodeExpiry: otpExpiry,
      },
      { new: true, upsert: false }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Attempting to send email to:', email, 'with OTP:', otp, 'Purpose:', purpose);
    
    // Send appropriate email based on purpose
    if (purpose === 'resetPassword') {
      await sendPasswordResetEmail(email, user.fullName, otp);
      console.log('Password reset OTP sent successfully to:', email);
    } else {
      // Default to verification email
      await sendVerificationEmail(email, user._id.toString(), otp); // Use user ID as token for simplicity
      console.log('Verification OTP sent successfully to:', email);
    }
    
    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Failed to send OTP:', error);
    res.status(500).json({ error: 'Failed to send OTP', details: String(error) });
  }
}
