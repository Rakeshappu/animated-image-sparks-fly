
import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../../lib/db/connect';
import { User } from '../../../../lib/db/models/User';
import jwt from 'jsonwebtoken';

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
      
      // Get unique departments
      const departmentsResult = await User.distinct('department');
      
      return res.status(200).json({
        departments: departmentsResult
      });
    } catch (error) {
      console.error('Error fetching departments:', error);
      return res.status(500).json({ error: 'Internal server error', details: (error as Error).message });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
