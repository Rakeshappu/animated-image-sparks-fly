import express from 'express';
import { User } from '../../lib/db/models/User.js';
import { EligibleUSN } from '../../lib/db/models/EligibleUSN.js';
import { generateToken, verifyToken, generateOTP } from '../../lib/auth/jwt.js';
import { sendVerificationEmail } from '../../lib/email/sendEmail.js';
import connectDB from '../../lib/db/connect.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Simple health check route
router.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Auth service is running' });
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Ensure DB connection
    await connectDB();
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check if password matches
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token with role explicitly included
    const token = generateToken(user._id.toString(), user.role);
    
    console.log(`User logged in: ${user._id} with role: ${user.role}`);
    
    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isEmailVerified
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Signup route
router.post('/signup', async (req, res) => {
  try {
    const { email, password, fullName, role, usn, department, phoneNumber, secretNumber, semester } = req.body;
    
    if (!email || !password || !fullName || !role) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }
    
    // Ensure DB connection
    await connectDB();
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Validate faculty secret number
    if (role === 'faculty' && (!secretNumber || secretNumber !== 'FACULTY2024')) {
      console.log('Invalid faculty secret number provided');
      return res.status(400).json({ error: 'Invalid faculty secret number' });
    }
    
    // For students, validate USN
    if (role === 'student') {
      if (!usn) {
        return res.status(400).json({ error: 'USN is required for student registration' });
      }

      // Check if USN already exists
      const existingUSNUser = await User.findOne({ usn });
      if (existingUSNUser) {
        return res.status(400).json({ error: 'USN already registered with another account' });
      }

      // Check if USN is in the eligible list
      const eligibleUSN = await EligibleUSN.findOne({ 
        usn: usn.toUpperCase(),
        isUsed: false
      });
      
      if (!eligibleUSN) {
        return res.status(400).json({ error: 'This USN is not eligible for registration' });
      }
      
      // Mark USN as used
      eligibleUSN.isUsed = true;
      await eligibleUSN.save();
    }
    
    // Generate verification token and OTP
    const verificationToken = generateOTP();
    const otpExpiry = new Date();
    otpExpiry.setHours(otpExpiry.getHours() + 24); // 24 hours

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user data object with common fields
    const userData: any = {
      email,
      password: hashedPassword,
      fullName,
      role,
      department,
      phoneNumber,
      verificationToken,
      verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
      verificationCode: verificationToken,
      verificationCodeExpiry: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes expiry
    };

    // Add role-specific fields
    if (role === 'faculty') {
      userData.secretNumber = secretNumber;
    }
    if (role === 'student') {
      userData.semester = semester;
      userData.usn = usn ? usn.toUpperCase() : undefined;
    }

    const user = new User(userData);
    await user.save();
    console.log('User created successfully:', email);

    // Send OTP to email
    try {
      await sendVerificationEmail(email, verificationToken, verificationToken);
      console.log('Verification email sent to:', email);
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      // Continue with registration even if email fails
    }

    // Generate JWT token with role explicitly included
    const token = generateToken(user._id.toString(), user.role);

    return res.status(201).json({ 
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isVerified: false
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify email route
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }
    
    // Ensure DB connection
    await connectDB();
    
    // Find user by verification token
    const user = await User.findOne({ 
      verificationToken: token,
      verificationTokenExpiry: { $gt: new Date() }
    });
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }
    
    // Mark email as verified
    user.isEmailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    
    await user.save();
    
    // Generate JWT token with role
    const authToken = generateToken(user._id.toString(), user.role);
    
    res.status(200).json({
      message: 'Email verified successfully',
      token: authToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isVerified: true
      }
    });
    
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Server error during verification' });
  }
});

// Verify OTP route
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }
    
    // Ensure DB connection
    await connectDB();
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify OTP
    if (user.verificationCode !== otp || 
        !user.verificationCodeExpiry || 
        user.verificationCodeExpiry < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }
    
    // Mark email as verified
    user.isEmailVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpiry = undefined;
    
    await user.save();
    
    // Generate JWT token with role
    const token = generateToken(user._id.toString(), user.role);
    
    res.status(200).json({
      message: 'OTP verified successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isVerified: true
      }
    });
    
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'Server error during OTP verification' });
  }
});

// Resend OTP route
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Ensure DB connection
    await connectDB();
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Generate new OTP
    const otp = generateOTP();
    
    // Update user with new OTP
    user.verificationCode = otp;
    user.verificationCodeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    await user.save();
    
    // Send OTP to email
    try {
      await sendVerificationEmail(email, user.verificationToken || otp, otp);
      res.status(200).json({ message: 'OTP sent successfully' });
    } catch (emailError) {
      console.error('Error sending OTP email:', emailError);
      res.status(500).json({ error: 'Failed to send OTP email' });
    }
    
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: 'Server error during OTP resend' });
  }
});

// Export the router
export default router;