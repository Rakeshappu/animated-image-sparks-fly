import express from 'express';
import { User } from '../../lib/db/models/User';
import { generateOTP, generateVerificationToken } from '../../lib/auth/jwt';
import { sendVerificationEmail } from '../../lib/email/sendEmail';
import { verifyEmailConfig } from '../../lib/email/config';
import connectDB from '../../lib/db/connect';
import nodemailer from 'nodemailer';

const router = express.Router();

// ... keep existing code

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
    await sendVerificationEmail(email, verificationToken, otp);
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
    
    // Generate reset token and OTP
    const resetToken = generateVerificationToken();
    const resetOtp = generateOTP();
    
    // Update user with reset token
    user.resetPasswordToken = resetToken;
    user.resetPasswordOtp = resetOtp;
    user.resetPasswordExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour expiry
    await user.save();
    
    // Send reset password email with OTP
    try {
      // Create a transporter
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    
      // Email content
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Reset Your Password - VersatileShare',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #4f46e5; text-align: center;">Reset Your Password</h2>
            <p>Hello,</p>
            <p>We received a request to reset your password for your VersatileShare account. Please use the following OTP to reset your password:</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
              <h1 style="margin: 0; color: #4f46e5; font-size: 24px; letter-spacing: 5px;">${resetOtp}</h1>
            </div>
            <p>This OTP will expire in 1 hour.</p>
            <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
            <p style="margin-top: 30px; font-size: 12px; color: #6b7280; text-align: center;">
              &copy; ${new Date().getFullYear()} VersatileShare. All rights reserved.
            </p>
          </div>
        `
      };
    
      // Send email
      await transporter.sendMail(mailOptions);
      console.log('Password reset email sent to:', email);
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      return res.status(500).json({ error: 'Failed to send password reset email' });
    }
    
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

// Add reset password endpoint
router.post('/reset-password', async (req, res) => {
  try {
    await connectDB();
    console.log('Processing reset password request');
    
    const { email, otp, newPassword } = req.body;
    
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP and new password are required' });
    }
    
    // Find user with matching reset token and non-expired token
    const user = await User.findOne({
      email,
      resetPasswordOtp: otp,
      resetPasswordExpires: { $gt: new Date() }
    });
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }
    
    // Set new password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    
    return res.status(200).json({ success: true, message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router;