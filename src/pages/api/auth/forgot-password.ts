
import type { NextApiRequest, NextApiResponse } from 'next';
import { User } from '../../../lib/db/models/User';
import { generateOTP } from '../../../lib/auth/otp';
import { sendPasswordResetEmail } from '../../../lib/email/sendEmail';
import connectDB from '../../../lib/db/connect';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
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

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'No account found with that email address' });
    }

    // Generate reset code
    const resetCode = generateOTP();
    const resetCodeExpiry = new Date();
    resetCodeExpiry.setHours(resetCodeExpiry.getHours() + 1); // 1 hour expiry

    // Save reset code to user
    user.verificationCode = resetCode;
    user.verificationCodeExpiry = resetCodeExpiry;
    await user.save();

    console.log(`Generated OTP for ${email}: ${resetCode}`);

    // Send password reset email using the updated function
    await sendPasswordResetEmail(email, user.fullName, resetCode);
    console.log('Password reset email sent to:', email);

    return res.status(200).json({ success: true, message: 'Password reset instructions sent to your email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'Failed to process password reset request' });
  }
}
