import express from 'express';
import { User } from '../../lib/db/models/User';
import { generateOTP, generateVerificationToken } from '../../lib/auth/jwt';
import { sendVerificationEmail } from '../../lib/email/sendEmail';
import connectDB from '../../lib/db/connect';

const router = express.Router();

// Login route
router.post('/login', async (req, res) => {
  try {
    await connectDB();
    
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate token
    const token = user.generateAuthToken();
    
    res.json({ token, user: user.toJSON() });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Signup route
router.post('/signup', async (req, res) => {
  try {
    await connectDB();
    
    const { email, password, fullName, role, department, phoneNumber, secretNumber } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Validate faculty secret number
    if (role === 'faculty' && (!secretNumber || secretNumber !== 'FACULTY2024')) {
      return res.status(400).json({ error: 'Invalid faculty secret number' });
    }
    
    // Generate verification token and OTP
    const verificationToken = generateVerificationToken();
    const otp = generateOTP();
    
    // Create user
    const user = new User({
      email,
      password,
      fullName,
      role,
      department,
      phoneNumber,
      secretNumber: role === 'faculty' ? secretNumber : undefined,
      verificationToken,
      verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
      otp
    });
    
    await user.save();
    
    // Send verification email
    await sendVerificationEmail(email, verificationToken, otp);
    
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Forgot password route
router.post('/forgot-password', async (req, res) => {
  try {
    await connectDB();
    
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Find user
    const user = await User.findOne({ email });
    
    // Generate reset token regardless of whether user exists (security)
    const resetToken = generateVerificationToken();
    const otp = generateOTP();
    
    if (user) {
      // Update user with reset token
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour
      user.otp = otp;
      await user.save();
      
      // Send reset email with OTP
      try {
        await sendVerificationEmail(email, resetToken, otp);
        console.log('Password reset email sent');
      } catch (emailError) {
        console.error('Error sending password reset email:', emailError);
      }
    }
    
    // Always return success (security)
    return res.status(200).json({ 
      message: 'If your email is registered, you will receive password reset instructions.',
      success: true
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'Failed to process request' });
  }
});

// Verify email route
router.post('/verify-email', async (req, res) => {
  try {
    await connectDB();
    
    const { token, otp } = req.body;
    
    if (!token || !otp) {
      return res.status(400).json({ error: 'Token and OTP are required' });
    }
    
    // Find user
    const user = await User.findOne({ 
      verificationToken: token,
      verificationTokenExpiry: { $gt: new Date() }
    });
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }
    
    // Verify OTP
    if (user.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }
    
    // Mark email as verified
    user.isEmailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    user.otp = undefined;
    
    await user.save();
    
    // Generate token
    const authToken = user.generateAuthToken();
    
    res.json({ 
      message: 'Email verified successfully', 
      token: authToken,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Resend verification email
router.post('/resend-verification', async (req, res) => {
  try {
    await connectDB();
    
    const { email } = req.body;
    
    // Find user
    const user = await User.findOne({ email, isEmailVerified: false });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or already verified' });
    }
    
    // Generate new verification token and OTP
    const otp = generateOTP();
    const verificationToken = generateVerificationToken();
    
    // Update user
    user.verificationToken = verificationToken;
    user.verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    user.otp = otp;
    await user.save();
    
    // Send new verification email
    await sendVerificationEmail(email, verificationToken, otp);
    
    res.json({ message: 'Verification email resent successfully' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification email' });
  }
});

module.exports = router;