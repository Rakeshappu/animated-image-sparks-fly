
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
  
  if (req.method === 'POST') {
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
      
      // Ensure the user is an admin
      if (decoded.role !== 'admin') {
        const isAdmin = await checkAdminInDatabase(decoded.userId);
        if (!isAdmin) {
          return res.status(403).json({ error: 'Not authorized' });
        }
      }
      
      const { userIds, updates } = req.body;
      
      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ error: 'User IDs array is required' });
      }
      
      if (!updates || typeof updates !== 'object') {
        return res.status(400).json({ error: 'Updates object is required' });
      }
      
      // Validate semester if it's being updated
      if (updates.semester !== undefined) {
        const semester = Number(updates.semester);
        if (isNaN(semester) || semester < 1 || semester > 8) {
          return res.status(400).json({ error: 'Semester must be a number between 1 and 8' });
        }
      }
      
      // Update the users
      const updateResult = await User.updateMany(
        { _id: { $in: userIds }, role: 'student' },
        { $set: updates }
      );
      
      return res.status(200).json({
        success: true,
        message: `Updated ${updateResult.modifiedCount} students successfully`,
        modifiedCount: updateResult.modifiedCount
      });
    } catch (error) {
      console.error('Error updating users:', error);
      return res.status(500).json({ error: 'Internal server error', details: (error as Error).message });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
