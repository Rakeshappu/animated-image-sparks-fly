
import type { NextApiRequest, NextApiResponse } from 'next';
import { User } from '../../../lib/db/models/User';
import { generateToken } from '../../../lib/auth/jwt';
import connectDB from '../../../lib/db/connect';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
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

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(401).json({ 
        error: 'Email not verified. Please check your email for verification instructions.',
        requireVerification: true,
        email: user.email 
      });
    }

    // For admin role, check if admin verified
    if (user.role === 'admin' && !user.isAdminVerified) {
      return res.status(401).json({ 
        error: 'Your admin account is pending approval.',
        requireAdminApproval: true,
        email: user.email 
      });
    }

    // Generate token
    const token = generateToken(user._id);
    
    // Set token expiry
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7); // 7 days expiry

    // Update user's last login
    user.lastLogin = new Date();
    await user.save();

    // Return user data without sensitive fields
    const userData = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      isAdminVerified: user.isAdminVerified,
      department: user.department,
      avatar: user.avatar,
      phoneNumber: user.phoneNumber,
      createdAt: user.createdAt,
      semester: user.semester,
      batch: user.batch,
      degree: user.degree,
      usn: user.usn,
    };

    return res.status(200).json({
      token,
      user: userData,
      expiresAt: expiryDate.toISOString()
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Failed to log in' });
  }
}
