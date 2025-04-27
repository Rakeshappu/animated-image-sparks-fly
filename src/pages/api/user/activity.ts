
import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../lib/db/connect';
import { Activity, Resource } from '../../../lib/db/models';
import jwt from 'jsonwebtoken';

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
    
    const user = await authenticateUser(req, res);
    if (!user) return;
    
    if (req.method === 'GET') {
      const limit = parseInt(req.query.limit as string) || 3;
      
      // Get only view activities for the current user, sorted by most recent
      const activities = await Activity.find({ 
        user: user._id,
        type: 'view'
      })
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate('resource', 'title fileUrl')
        .lean();
      
      // Format the data to match the expected format in the ActivityFeed component
      const formattedActivities = activities.map(activity => ({
        ...activity,
        resourceId: activity.resource
      }));
      
      return res.status(200).json({ activities: formattedActivities });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Activity API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
