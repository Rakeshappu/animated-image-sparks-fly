
import { Request, Response } from 'express';
import { User } from '../../lib/db/models/User.ts';
import connectDB from '../../lib/db/connect.ts';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { token, otp } = req.body;
    
    let user;
    
    // If OTP is provided, verify with OTP
    if (otp) {
      user = await User.findOne({
        otp,
        otpExpiry: { $gt: new Date() }
      });
      
      if (!user) {
        return res.status(400).json({ error: 'Invalid or expired OTP' });
      }
    } 
    // If token is provided, verify with token
    else if (token) {
      user = await User.findOne({
        verificationToken: token,
        verificationTokenExpiry: { $gt: new Date() },
      });
      
      if (!user) {
        return res.status(400).json({ error: 'Invalid or expired verification token' });
      }
    } 
    // If neither is provided
    else {
      return res.status(400).json({ error: 'Verification token or OTP is required' });
    }

    // Update user
    user.isEmailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
