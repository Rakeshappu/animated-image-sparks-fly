
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
  
  if (req.method === 'GET') {
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
      
      console.log('Token decoded for user management:', decoded);
      
      // Ensure the user is an admin (check token first, then database)
      if (decoded.role !== 'admin') {
        console.log('Role not found in token, checking database...');
        const isAdmin = await checkAdminInDatabase(decoded.userId);
        
        if (!isAdmin) {
          return res.status(403).json({ error: 'Not authorized' });
        }
        console.log('Admin verified from database');
      } else {
        console.log('Admin verified from token');
      }
      
      // Get all users
      const users = await User.find({}, {
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
      });
      
      return res.status(200).json({ users });
    } catch (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ error: 'Internal server error', details: (error as Error).message });
    }
  } else if (req.method === 'DELETE') {
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
      
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      
      // Prevent admin from deleting their own account
      if (userId === decoded.userId) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }
      
      // Delete user
      const result = await User.findByIdAndDelete(userId);
      
      if (!result) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      return res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      return res.status(500).json({ error: 'Internal server error', details: (error as Error).message });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
