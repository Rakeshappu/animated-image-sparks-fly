import express from 'express';
import { User } from '../../lib/db/models/User.js';
import { generateToken, verifyToken } from '../../lib/auth/jwt.js';
import { sendVerificationEmail } from '../../lib/email/sendEmail.js';
import connectDB from '../../lib/db/connect.js';

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
    
    // Generate JWT token
    const token = generateToken(user._id.toString());
    
    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Export the router
export default router;
 