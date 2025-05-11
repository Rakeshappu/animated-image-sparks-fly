
import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../../lib/db/connect';
import { User } from '../../../../lib/db/models/User';
import jwt from 'jsonwebtoken';
import { checkAdminInDatabase } from '../../_middleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    await connectDB();
    
    // Get authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Verify token
    const token = authHeader.split(' ')[1];
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-for-development';
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string, role?: string };
    
    // Ensure the user is an admin (check token first, then database)
    if (decoded.role !== 'admin') {
      const isAdmin = await checkAdminInDatabase(decoded.userId);
      if (!isAdmin) {
        return res.status(403).json({ error: 'Not authorized' });
      }
    }
    
    // Get userId from query parameter
    const { userId } = req.query;
    
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    if (req.method === 'GET') {
      // Get user by ID
      const user = await User.findById(userId, {
        _id: 1,
        fullName: 1,
        email: 1,
        role: 1,
        department: 1,
        semester: 1,
        isEmailVerified: 1,
        isAdminVerified: 1,
        avatar: 1,
        lastLogin: 1,
        createdAt: 1,
        gender: 1,
        batch: 1,
        degree: 1,
        usn: 1,
        qualification: 1,
        designation: 1,
      });
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      return res.status(200).json({ user });
    } else if (req.method === 'PUT') {
      // Update user
      const updateData = req.body;
      
      // Remove fields that shouldn't be updated
      delete updateData._id;
      
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
      );
      
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      return res.status(200).json({ success: true, user: updatedUser });
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error handling user request:', error);
    return res.status(500).json({ error: 'Internal server error', details: (error as Error).message });
  }
}
