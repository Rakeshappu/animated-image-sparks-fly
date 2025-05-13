import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../../lib/db/models/User.js';
import { EligibleUSN } from '../../lib/db/models/EligibleUSN.js';
import { generateToken } from '../utils/auth.js';
import { sendVerificationEmail } from '../../lib/email/sendEmail.js';
import { generateOTP } from '../../lib/auth/otp.js';

// Signup controller with proper validation and response
export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, role, usn, department, semester, phoneNumber } = req.body;

    if (!email || !password || !fullName || !role) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    // For student role, validate USN exists and is not already used
    if (role === 'student' && usn) {
      const eligibleUSN = await EligibleUSN.findOne({ usn: usn.toUpperCase() });
      
      if (!eligibleUSN) {
        return res.status(400).json({ error: 'USN is not in the eligible list' });
      }
      
      if (eligibleUSN.isUsed) {
        return res.status(400).json({ error: 'USN is already in use' });
      }
      
      // Mark USN as used
      eligibleUSN.isUsed = true;
      await eligibleUSN.save();
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate OTP for email verification
    const verificationOTP = generateOTP();
    const otpExpiry = new Date();
    otpExpiry.setHours(otpExpiry.getHours() + 24); // OTP valid for 24 hours

    // Create user
    const newUser = new User({
      email,
      password: hashedPassword,
      fullName,
      role,
      usn: role === 'student' ? usn.toUpperCase() : undefined,
      department,
      semester: role === 'student' ? semester : undefined,
      phoneNumber,
      verificationOTP,
      verificationOTPExpiry: otpExpiry,
    });

    await newUser.save();

    // Send verification email
    await sendVerificationEmail(email, fullName, verificationOTP);

    // Generate a token with the role included
    const token = generateToken(newUser._id.toString(), role);

    res.status(201).json({
      message: 'User registered successfully. Please verify your email.',
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
        isVerified: false,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Error creating user account' });
  }
};

// Login controller with proper validation
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token with role explicitly included
    const token = generateToken(user._id.toString(), user.role);

    console.log(`User logged in: ${user._id} with role: ${user.role}`);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        department: user.department,
        phoneNumber: user.phoneNumber,
        avatar: user.avatar || undefined,
        semester: user.semester || undefined,
        isVerified: !!user.isEmailVerified,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error during login' });
  }
};

// Email verification controller
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    // Check if OTP is correct and not expired
    if (
      user.verificationOTP !== otp ||
      !user.verificationOTPExpiry ||
      new Date() > user.verificationOTPExpiry
    ) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.verificationOTP = undefined;
    user.verificationOTPExpiry = undefined;
    
    await user.save();

    // Send welcome email
    // await sendWelcomeEmail(user.email, user.fullName);

    // Generate a new token with the role included
    const token = generateToken(user._id.toString(), user.role);

    res.json({
      message: 'Email verified successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isVerified: true,
      },
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Error verifying email' });
  }
};

// Resend verification email
export const resendVerification = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    // Generate new OTP
    const verificationOTP = generateOTP();
    const otpExpiry = new Date();
    otpExpiry.setHours(otpExpiry.getHours() + 24); // OTP valid for 24 hours

    // Update user with new OTP
    user.verificationOTP = verificationOTP;
    user.verificationOTPExpiry = otpExpiry;
    await user.save();

    // Send verification email
    await sendVerificationEmail(email, user.fullName, verificationOTP);

    res.json({ message: 'Verification email resent successfully' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Error resending verification email' });
  }
};
