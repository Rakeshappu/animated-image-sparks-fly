import { NextApiRequest, NextApiResponse } from 'next';
import connectDB, { verifyDbConnection } from '../../../lib/db/connect';
import { Resource } from '../../../lib/db/models/Resource';
import { Activity } from '../../../lib/db/models/Activity';
import mongoose from 'mongoose';

// Define types to fix TypeScript errors
interface DailyView {
  date: Date;
  count: number;
}

interface ResourceStats {
  views: number;
  downloads: number;
  likes: number;
  comments: number;
  lastViewed: Date;
  dailyViews: DailyView[];
  studentFeedback?: { rating: number; count: number }[];
}

interface ResourceType {
  _id: string;
  title: string;
  description?: string;
  type: 'document' | 'video' | 'note' | 'link';
  stats?: ResourceStats;
  likedBy: string[];
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ActivityType {
  _id: string;
  user: mongoose.Types.ObjectId;
  type: 'view' | 'download' | 'upload' | 'like' | 'comment';
  resource?: mongoose.Types.ObjectId;
  timestamp: Date;
  details?: any;
}

interface DailyActivityData {
  name: string;
  date: string;
  uploads: number;
  downloads: number;
  views: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Support both GET and POST methods for fetching and updating stats
  if (req.method === 'GET') {
    try {
      // Connect to MongoDB
      await connectDB();
      
      // Verify connection
      const dbStatus = await verifyDbConnection();
      if (!dbStatus.connected) {
        console.error('MongoDB connection issue:', dbStatus.message);
        return res.status(500).json({ 
          error: 'Database connection error', 
          details: dbStatus.message 
        });
      }

      console.log('Connected to MongoDB successfully');
      
      // Get total resource count
      const totalResources = await Resource.countDocuments({ deletedAt: null });
      console.log(`Total resources: ${totalResources}`);
      
      // Get resource type distribution
      let resources: ResourceType[] = [];
      try {
        resources = await Resource.find({ deletedAt: null }).lean();
        console.log(`Found ${resources.length} resources`);
      } catch (findError) {
        console.error('Error finding resources:', findError);
      }
      
      // Get total counts for views, likes, and downloads
      let totalViews = 0;
      let totalLikes = 0;
      let totalDownloads = 0;
      
      try {
        resources.forEach((resource: ResourceType) => {
          totalViews += (resource.stats?.views || 0);
          totalLikes += (resource.stats?.likes || 0);
          totalDownloads += (resource.stats?.downloads || 0);
        });
        
        console.log(`Total stats: views=${totalViews}, likes=${totalLikes}, downloads=${totalDownloads}`);
      } catch (statsError) {
        console.error('Error calculating totals:', statsError);
      }
      
      const typeDistribution = [
        { name: 'Document', value: resources.filter(r => r.type === 'document').length },
        { name: 'Video', value: resources.filter(r => r.type === 'video').length },
        { name: 'Note', value: resources.filter(r => r.type === 'note').length },
        { name: 'Link', value: resources.filter(r => r.type === 'link').length }
      ];
      
      // Get daily activity for the past week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      // Get activities from the past week
      let activities: ActivityType[] = [];
      try {
        activities = await Activity.find({
          timestamp: { $gte: oneWeekAgo },
          type: { $in: ['view', 'download', 'upload'] }
        }).lean();
        
        console.log(`Found ${activities.length} activities in the past week`);
      } catch (activityError) {
        console.error('Error finding activities:', activityError);
      }
      
      // Group activities by day
      const dailyActivity: DailyActivityData[] = [];
      const dayMap = new Map<string, DailyActivityData>();
      
      // Initialize the past 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const dayStr = date.toISOString().split('T')[0];
        dayMap.set(dayStr, {
          name: date.toLocaleDateString('en-US', { weekday: 'short' }),
          date: dayStr,
          uploads: 0,
          downloads: 0,
          views: 0
        });
      }
      
      // Count activities by day
      try {
        activities.forEach((activity: ActivityType) => {
          if (!activity.timestamp) {
            console.log('Activity missing timestamp:', activity);
            return;
          }
          
          const date = new Date(activity.timestamp);
          const dayStr = date.toISOString().split('T')[0];
          
          if (dayMap.has(dayStr)) {
            const dayData = dayMap.get(dayStr)!;
            if (activity.type === 'view') dayData.views += 1;
            if (activity.type === 'download') dayData.downloads += 1;
            if (activity.type === 'upload') dayData.uploads += 1;
          }
        });
      } catch (mapError) {
        console.error('Error mapping activities by day:', mapError);
      }
      
      // Convert map to array for response
      dayMap.forEach(value => {
        dailyActivity.push(value);
      });
      
      // Calculate today's stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayActivities = activities.filter((activity: ActivityType) => {
        if (!activity.timestamp) return false;
        const activityDate = new Date(activity.timestamp);
        activityDate.setHours(0, 0, 0, 0);
        return activityDate.getTime() === today.getTime();
      });
      
      const todayUploads = todayActivities.filter(a => a.type === 'upload').length;
      const todayDownloads = todayActivities.filter(a => a.type === 'download').length;
      const todayViews = todayActivities.filter(a => a.type === 'view').length;
      
      console.log('Daily activity data:', dailyActivity);
      console.log('Today stats:', { uploads: todayUploads, downloads: todayDownloads, views: todayViews });
      
      return res.status(200).json({
        totalResources,
        totalViews,
        totalLikes,
        totalDownloads,
        typeDistribution,
        dailyActivity,
        dailyStats: dailyActivity,
        todayStats: {
          uploads: todayUploads,
          downloads: todayDownloads,
          views: todayViews
        }
      });
    } catch (error) {
      console.error('Error fetching resource stats:', error);
      return res.status(500).json({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  } else if (req.method === 'POST') {
    try {
      // Connect to MongoDB
      await connectDB();
      
      // Verify connection
      const dbStatus = await verifyDbConnection();
      if (!dbStatus.connected) {
        console.error('MongoDB connection issue:', dbStatus.message);
        return res.status(500).json({ 
          error: 'Database connection error', 
          details: dbStatus.message 
        });
      }
      
      const { resourceId, action, userId } = req.body;
      
      if (!resourceId || !action) {
        return res.status(400).json({ error: 'resourceId and action are required' });
      }
      
      const resource = await Resource.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }
      
      // Update the appropriate stat
      switch (action) {
        case 'view':
          // Initialize stats if needed
          if (!resource.stats) {
            resource.stats = {
              views: 0,
              downloads: 0,
              likes: 0,
              comments: 0,
              lastViewed: new Date(),
              dailyViews: []
            };
          }
          
          // Update view count
          resource.stats.views += 1;
          resource.stats.lastViewed = new Date();
          
          // Update or create daily view count
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          if (!resource.stats.dailyViews) {
            resource.stats.dailyViews = [];
          }
          
          const todayViewIndex = resource.stats.dailyViews.findIndex((view: DailyView) => {
            const viewDate = new Date(view.date);
            return viewDate.toDateString() === today.toDateString();
          });
          
          if (todayViewIndex >= 0) {
            resource.stats.dailyViews[todayViewIndex].count += 1;
          } else {
            resource.stats.dailyViews.push({
              date: today,
              count: 1
            });
          }
          
          // Create activity record if userId is provided
          if (userId) {
            try {
              await Activity.create({
                user: new mongoose.Types.ObjectId(userId),
                type: 'view',
                resource: resource._id,
                details: { timestamp: new Date() },
                timestamp: new Date()
              });
            } catch (activityError) {
              console.error('Failed to create activity record:', activityError);
              // Continue with view tracking even if activity creation fails
            }
          }
          break;
          
        case 'download':
          if (!resource.stats) {
            resource.stats = {
              views: 0,
              downloads: 0,
              likes: 0,
              comments: 0,
              lastViewed: new Date(),
              dailyViews: []
            };
          }
          resource.stats.downloads += 1;
          
          // Create activity record if userId is provided
          if (userId) {
            try {
              await Activity.create({
                user: new mongoose.Types.ObjectId(userId),
                type: 'download',
                resource: resource._id,
                details: { timestamp: new Date() },
                timestamp: new Date()
              });
            } catch (activityError) {
              console.error('Failed to create activity record:', activityError);
            }
          }
          break;
          
        case 'like':
          if (!resource.stats) {
            resource.stats = {
              views: 0,
              downloads: 0,
              likes: 0,
              comments: 0,
              lastViewed: new Date(),
              dailyViews: []
            };
          }
          resource.stats.likes += 1;
          
          // Add user to likedBy array if userId is provided
          if (userId && !resource.likedBy.includes(userId)) {
            resource.likedBy.push(userId);
            
            // Create activity record
            try {
              await Activity.create({
                user: new mongoose.Types.ObjectId(userId),
                type: 'like',
                resource: resource._id,
                details: { timestamp: new Date() },
                timestamp: new Date()
              });
            } catch (activityError) {
              console.error('Failed to create like activity record:', activityError);
            }
          }
          break;
          
        case 'comment':
          if (!resource.stats) {
            resource.stats = {
              views: 0,
              downloads: 0,
              likes: 0,
              comments: 0,
              lastViewed: new Date(),
              dailyViews: []
            };
          }
          resource.stats.comments += 1;
          
          // Create activity record if userId is provided
          if (userId) {
            try {
              await Activity.create({
                user: new mongoose.Types.ObjectId(userId),
                type: 'comment',
                resource: resource._id,
                details: { timestamp: new Date() },
                timestamp: new Date()
              });
            } catch (activityError) {
              console.error('Failed to create comment activity record:', activityError);
            }
          }
          break;
          
        default:
          return res.status(400).json({ error: 'Invalid action' });
      }
      
      await resource.save();
      
      return res.status(200).json({ 
        success: true, 
        stats: resource.stats,
        dbStatus: dbStatus
      });
    } catch (error) {
      console.error('Error updating resource stats:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
