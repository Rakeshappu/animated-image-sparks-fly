
import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../lib/db/connect';
import { Activity } from '../../../lib/db/models';
import jwt from 'jsonwebtoken';

// Authentication middleware
const authenticateUser = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return null;
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as { userId: string };
    
    return { _id: decoded.userId };
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
    return null;
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectDB();
    
    // Check authentication
    const user = await authenticateUser(req, res);
    if (!user) {
      return;
    }
    
    // GET request - fetch activities
    if (req.method === 'GET') {
      const limit = parseInt(req.query.limit as string) || 10;
      
      // Get activities for the current user
      const activities = await Activity.find({ userId: user._id })
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate('resourceId', 'title type');
      
      return res.status(200).json({ activities });
    }
    
    // POST request - create new activity
    if (req.method === 'POST') {
      const { type, resourceId, message } = req.body;
      
      if (!type || !message) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      const activity = await Activity.create({
        userId: user._id,
        type,
        resourceId,
        message,
        timestamp: new Date()
      });
      
      return res.status(201).json({ success: true, activity });
    }
    
    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Activity API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
