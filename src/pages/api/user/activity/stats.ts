
import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../../lib/db/connect';
import { Activity } from '../../../../lib/db/models/Activity';
import { User } from '../../../../lib/db/models/User';
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
      
      // For admin dashboard stats, check if user is admin
      if (req.query.admin === 'true') {
        if (decoded.role !== 'admin') {
          // Fallback to check in DB if user is admin
          const user = await User.findById(decoded.userId).select('role');
          if (user?.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
          }
          console.log('User is admin in DB but not in token. User should re-login.');
        }
      }
    } catch (tokenError) {
      console.error('Token verification error:', tokenError);
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    // Get total activity count
    const totalActivities = await Activity.countDocuments();
    const userId = decoded.userId;
    
    // Get today's activities count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayActivities = req.query.period === 'today'
      ? await Activity.countDocuments({
          user: userId,
          timestamp: { $gte: today }
        })
      : 0;
    
    // Calculate user streak
    let userStreak = 0;
    
    if (userId) {
      // Find the user to update streak
      const user = await User.findById(userId);
      
      if (user) {
        // Check if user has activity today
        const hasActivityToday = await Activity.exists({
          user: userId,
          timestamp: { $gte: today }
        });
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        // If user has activity today
        if (hasActivityToday) {
          // If this is the first time they're active or they were active yesterday
          if (!user.lastActive || new Date(user.lastActive).setHours(0, 0, 0, 0) === yesterday.getTime()) {
            // Increment streak
            userStreak = (user.streak || 0) + 1;
            
            // Update user with new streak and lastActive
            await User.findByIdAndUpdate(userId, {
              streak: userStreak,
              lastActive: new Date()
            });
            console.log(`Updated ${user.email}'s streak to ${userStreak}`);
          } else if (new Date(user.lastActive).setHours(0, 0, 0, 0) === today.getTime()) {
            // Already active today, maintain current streak
            userStreak = user.streak || 1;
            console.log(`Maintained ${user.email}'s streak at ${userStreak}`);
          } else {
            // Not consecutive days, reset streak
            userStreak = 1;
            await User.findByIdAndUpdate(userId, {
              streak: 1,
              lastActive: new Date()
            });
            console.log(`Reset ${user.email}'s streak to 1`);
          }
        } else {
          // No activity today, keep existing streak
          userStreak = user.streak || 0;
          console.log(`User ${user.email} has no activity today, streak remains ${userStreak}`);
        }
      }
    }
    
    // If this is just a request for today's count, return it now
    if (req.query.period === 'today') {
      return res.status(200).json({
        success: true,
        count: todayActivities,
        streak: userStreak
      });
    }
    
    // Get daily activity for past week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    // Create aggregation pipeline based on if it's for admin dashboard
    let matchStage = {};
    if (req.query.admin === 'true') {
      // For admin, get all activities across all users in the past week
      matchStage = { timestamp: { $gte: oneWeekAgo } };
      console.log('Fetching admin dashboard stats for all users');
    } else {
      // For regular users, only get their own activities
      matchStage = { 
        timestamp: { $gte: oneWeekAgo },
        user: decoded.userId
      };
      console.log('Fetching user dashboard stats for user:', decoded.userId);
    }
    
    console.log('Match stage for aggregation:', matchStage);
    
    // Get activity data grouped by day and type
    const dailyActivityData = await Activity.aggregate([
      {
        $match: matchStage
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
    
    console.log('Activity data from past week:', JSON.stringify(dailyActivityData));
    
    // Format for chart display
    const dailyActivity = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      
      const dateStr = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      // Find matching activities for each type
      const uploads = dailyActivityData.find(item => 
        item._id.year === year && 
        item._id.month === month && 
        item._id.day === day &&
        item._id.type === 'upload'
      );
      
      const downloads = dailyActivityData.find(item => 
        item._id.year === year && 
        item._id.month === month && 
        item._id.day === day &&
        item._id.type === 'download'
      );
      
      const views = dailyActivityData.find(item => 
        item._id.year === year && 
        item._id.month === month && 
        item._id.day === day &&
        item._id.type === 'view'
      );
      
      console.log(`Daily activity for ${dateStr}: uploads=${uploads?.count || 0}, downloads=${downloads?.count || 0}, views=${views?.count || 0}`);
      
      dailyActivity.push({
        name: dateStr,
        uploads: uploads ? uploads.count : 0,
        downloads: downloads ? downloads.count : 0,
        views: views ? views.count : 0
      });
    }
    
    // Get recent activities
    const recentActivitiesQuery = (req.query.admin === 'true')
      ? Activity.find() // All activities for admin
      : Activity.find({ user: decoded.userId }); // Only user's activities
    
    const recentActivities = await recentActivitiesQuery
      .sort({ timestamp: -1 })
      .limit(req.query.limit ? parseInt(req.query.limit as string) : 10)
      .populate('user', 'fullName')
      .populate('resource', 'title fileUrl subject stats');
    
    console.log(`Returning ${recentActivities.length} recent activities`);
    
    return res.status(200).json({
      success: true,
      totalActivities,
      dailyActivity,
      activities: recentActivities,
      streak: userStreak,  // Include streak in response
      todayCount: todayActivities  // Include today's activity count
    });
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    return res.status(500).json({ error: 'Internal server error', details: (error as Error).message });
  }
}
