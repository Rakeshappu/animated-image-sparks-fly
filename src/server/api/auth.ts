import express from 'express';
import { User } from '../../lib/db/models/User';
import { generateOTP, generateVerificationToken } from '../../lib/auth/jwt';
import { sendVerificationEmail } from '../../lib/email/sendEmail';
import { verifyEmailConfig } from '../../lib/email/config';
import connectDB from '../../lib/db/connect';

const router = express.Router();

// ... other routes ...

router.post('/resend-verification', async (req, res) => {
  try {
    await connectDB();
    console.log('Processing resend verification request');
    
    const { email } = req.body;
    
    // Find user
    const user = await User.findOne({ email, isEmailVerified: false });
    if (!user) {
      console.log('User not found or already verified:', email);
      return res.status(400).json({ error: 'Invalid email or already verified' });
    }
    const otp = generateOTP();
    // Generate new verification token
    const verificationToken = generateVerificationToken();
    
    // Update user with new token
    user.verificationToken = verificationToken;
    user.verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();
    
    // Send new verification email
    await sendVerificationEmail(email, verificationToken,otp);
    console.log('New verification email sent');

    res.json({ message: 'Verification email resent successfully' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification email' });
  }
});