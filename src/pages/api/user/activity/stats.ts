
import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../../lib/db/connect';
import { Activity } from '../../../../lib/db/models/Activity';
import jwt from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
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
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string, role?: string };
      if (!decoded || !decoded.userId) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    } catch (tokenError) {
      console.error('Token verification error:', tokenError);
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    // Get total activity count
    const totalActivities = await Activity.countDocuments();
    
    // Get daily activity for past week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const dailyActivityData = await Activity.aggregate([
      {
        $match: {
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
      { $sort: { date: 1 } }
    ]);
    
    console.log('Activity data from past week:', dailyActivityData);
    
    // Format for chart display
    const dailyActivity = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const dateStr = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      // Find matching activities for each type
      const uploads = dailyActivityData.find(item => 
        item._id.year === date.getFullYear() && 
        item._id.month === (date.getMonth() + 1) && 
        item._id.day === date.getDate() &&
        item._id.type === 'upload'
      );
      
      const downloads = dailyActivityData.find(item => 
        item._id.year === date.getFullYear() && 
        item._id.month === (date.getMonth() + 1) && 
        item._id.day === date.getDate() &&
        item._id.type === 'download'
      );
      
      const views = dailyActivityData.find(item => 
        item._id.year === date.getFullYear() && 
        item._id.month === (date.getMonth() + 1) && 
        item._id.day === date.getDate() &&
        item._id.type === 'view'
      );
      
      dailyActivity.push({
        name: dateStr,
        uploads: uploads ? uploads.count : 0,
        downloads: downloads ? downloads.count : 0,
        views: views ? views.count : 0
      });
    }
    
    // Get recent activities
    const recentActivities = await Activity.find()
      .sort({ timestamp: -1 })
      .limit(10)
      .populate('user', 'fullName')
      .populate('resource', 'title');
    
    return res.status(200).json({
      success: true,
      totalActivities,
      dailyActivity,
      recentActivities
    });
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    return res.status(500).json({ error: 'Internal server error', details: (error as Error).message });
  }
}
