
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

// Add forgot password endpoint
router.post('/forgot-password', async (req, res) => {
  try {
    await connectDB();
    console.log('Processing forgot password request');
    
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      // For security reasons, don't reveal that the user doesn't exist
      return res.status(200).json({ message: 'If your email is registered, you will receive password reset instructions.' });
    }
    
    // Generate reset token
    const resetToken = generateVerificationToken();
    
    // Update user with reset token
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour expiry
    await user.save();
    
    // TODO: In a real application, send an email with the reset token
    console.log('Reset token generated:', resetToken);
    
    // Return success message without revealing if the email exists
    return res.status(200).json({ 
      message: 'If your email is registered, you will receive password reset instructions.',
      success: true
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'Failed to process request' });
  }
});

module.exports = router;
