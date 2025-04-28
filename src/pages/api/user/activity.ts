
import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../lib/db/connect';
import { Activity } from '../../../lib/db/models/Activity';
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
  // Set headers for CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectDB();
    
    const user = await authenticateUser(req, res);
    if (!user) return;
    
    if (req.method === 'GET') {
      const limit = parseInt(req.query.limit as string) || 10;
      const type = req.query.type as string;
      
      // Build query for activities
      let query: any = { user: user._id };
      
      // If type is specified, filter by that type
      if (type) {
        query.type = type;
      }
      
      console.log('Fetching activities with query:', query);
      
      // Get activities for the current user, sorted by most recent
      const activities = await Activity.find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate('resource', 'title fileUrl subject stats')
        .lean();
      
      console.log(`Found ${activities.length} recent activities for user ${user._id}`);
      
      // Return empty array if no activities found
      return res.status(200).json({ activities: activities || [] });
      
    } else if (req.method === 'POST') {
      const { type, resourceId, message } = req.body;
      
      if (!type) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // Create a new activity record
      const newActivity = await Activity.create({
        user: user._id,
        type,
        resource: resourceId,
        timestamp: new Date(),
        message: message || `${type} resource`
      });
      
      if (resourceId) {
        await newActivity.populate('resource', 'title fileUrl subject stats');
      }
      
      return res.status(201).json({ success: true, activity: newActivity });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Activity API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
