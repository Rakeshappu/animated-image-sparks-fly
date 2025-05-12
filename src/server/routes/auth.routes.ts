import express from 'express';
import { User } from '../../lib/db/models/User.js';
import { generateToken, verifyToken } from '../../lib/auth/jwt.js';
import { sendVerificationEmail } from '../../lib/email/sendEmail.js';
import { connectDB } from '../../lib/db/connect.js';

const router = express.Router();

// Login route
router.post('/login', async (req, res) => {
  try {
    await connectDB();
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check if password is correct
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(401).json({ error: 'Please verify your email before logging in' });
    }
    
    // Check if admin verification is required (for faculty and admin roles)
    if ((user.role === 'faculty' || user.role === 'admin') && !user.isAdminVerified) {
      return res.status(401).json({ error: 'Your account is pending admin approval' });
    }
    
    // Update user streak
    await user.updateStreak();
    
    // Generate JWT token
    const token = generateToken(user._id.toString(), user.role);
    
    // Send user data (excluding password)
    const userData = user.toObject();
    delete userData.password;
    
    res.status(200).json({
      message: 'Login successful',
      token,
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register route
router.post('/signup', async (req, res) => {
  try {
    await connectDB();
    const { fullName, email, password, role, department, semester, secretNumber, usn } = req.body;

    if (!fullName || !email || !password || !role || !department) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Additional validation for student role
    if (role === 'student' && (!semester || !usn)) {
      return res.status(400).json({ error: 'Semester and USN are required for students' });
    }

    // Additional validation for faculty role
    if (role === 'faculty' && !secretNumber) {
      return res.status(400).json({ error: 'Secret number is required for faculty' });
    }

    const newUser = new User({
      fullName,
      email,
      password,
      role,
      department,
      semester: role === 'student' ? semester : undefined,
      secretNumber: role === 'faculty' ? secretNumber : undefined,
      usn: role === 'student' ? usn : undefined,
      isEmailVerified: false,
      isAdminVerified: role === 'admin' ? true : false, // Admins are auto-verified
    });

    // Save the user to the database
    await newUser.save();

    // Generate verification token
    const verificationToken = generateToken(newUser._id.toString(), 'emailVerification');
    newUser.verificationToken = verificationToken;
    newUser.verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // Token expires in 24 hours
    await newUser.save();

    // Send verification email
    await sendVerificationEmail(email, verificationToken, fullName);

    res.status(201).json({ message: 'Registration successful' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
