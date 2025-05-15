
import type { NextApiRequest, NextApiResponse } from 'next';
import { User } from '../../../lib/db/models/User';
import connectDB from '../../../lib/db/connect';
import { generateOTP } from '../../../lib/auth/otp';
import { sendEmail } from '../../../lib/email/sendEmail';

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

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'No account found with that email address' });
    }

    // Generate verification code (6-digit OTP)
    const verificationCode = generateOTP();
    
    // Set expiration to 1 hour from now
    const expiryTime = new Date();
    expiryTime.setHours(expiryTime.getHours() + 1);

    // Update user with verification code
    user.verificationCode = verificationCode;
    user.verificationCodeExpiry = expiryTime;
    await user.save();
    
    // Send email with verification code
    const emailSubject = 'Password Reset Request';
    const emailBody = `
      <h1>Password Reset</h1>
      <p>You requested a password reset. Please use the following code to reset your password:</p>
      <h2 style="font-size: 24px; letter-spacing: 5px; background: #f0f0f0; padding: 10px; text-align: center;">${verificationCode}</h2>
      <p>This code will expire in 1 hour.</p>
      <p>If you did not request a password reset, please ignore this email.</p>
    `;
    
    await sendEmail({
      to: email,
      subject: emailSubject,
      html: emailBody
    });

    return res.status(200).json({ 
      success: true, 
      message: 'Password reset instructions sent to your email' 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'Failed to process password reset request' });
  }
}
