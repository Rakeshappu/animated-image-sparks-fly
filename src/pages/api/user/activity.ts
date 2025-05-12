
import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../lib/db/connect.ts';
import { Activity } from '../../../lib/db/models/Activity.ts';
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
        .populate('resource', 'title fileUrl subject stats category placementCategory')
        .lean();
      
      console.log(`Found ${activities.length} recent activities for user ${user._id}`);
      
      // Also fetch weekly activity counts for chart
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      // Get daily activity data for the past week
      const dailyActivity = await Activity.aggregate([
        {
          $match: {
            user: user._id,
            timestamp: { $gte: oneWeekAgo }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: "$timestamp" },
              month: { $month: "$timestamp" },
              day: { $dayOfMonth: "$timestamp" },
              type: "$type"
            },
            count: { $sum: 1 },
            date: { $first: "$timestamp" }
          }
        },
        { $sort: { "date": 1 } }
      ]);
      
      // Format for chart display - last 7 days including today
      const chartData = [];
      
      // Generate data for last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        const dateStr = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        // Find matching activities for each type
        const uploads = dailyActivity.find(item => 
          item._id.year === year && 
          item._id.month === month && 
          item._id.day === day &&
          item._id.type === 'upload'
        );
        
        const downloads = dailyActivity.find(item => 
          item._id.year === year && 
          item._id.month === month && 
          item._id.day === day &&
          item._id.type === 'download'
        );
        
        const views = dailyActivity.find(item => 
          item._id.year === year && 
          item._id.month === month && 
          item._id.day === day &&
          item._id.type === 'view'
        );
        
        chartData.push({
          name: dateStr,
          uploads: uploads ? uploads.count : 0,
          downloads: downloads ? downloads.count : 0,
          views: views ? views.count : 0
        });
      }
      
      // Return empty array if no activities found
      return res.status(200).json({ 
        activities: activities || [],
        weeklyActivity: chartData,
        success: true
      });
      
    } else if (req.method === 'POST') {
      const { type, resourceId, message } = req.body;
      
      if (!type) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      console.log(`Creating new activity: ${type} for resource ${resourceId}`);
      
      // Ensure we don't create duplicate recent activities
      if (resourceId) {
        // Check for recent duplicate activity (within last minute)
        const recentDuplicate = await Activity.findOne({
          user: user._id,
          type,
          resource: resourceId,
          timestamp: { $gte: new Date(Date.now() - 60000) } // Last minute
        });
        
        if (recentDuplicate) {
          console.log(`Skipping duplicate ${type} activity for resource ${resourceId}`);
          // Just update the timestamp instead of creating a new record
          recentDuplicate.timestamp = new Date();
          await recentDuplicate.save();
          await recentDuplicate.populate('resource', 'title fileUrl subject stats category placementCategory');
          return res.status(200).json({ 
            success: true, 
            activity: recentDuplicate,
            updated: true
          });
        }
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
        await newActivity.populate('resource', 'title fileUrl subject stats category placementCategory');
      }
      
      console.log(`Created activity with ID: ${newActivity._id}`);
      return res.status(201).json({ 
        success: true, 
        activity: newActivity,
        created: true
      });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Activity API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
