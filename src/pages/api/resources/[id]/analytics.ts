
import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../../lib/db/connect.ts';
import { Resource } from '../../../../lib/db/models/Resource.ts';
import { Activity } from '../../../../lib/db/models/Activity.ts';
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
    
    const { id } = req.query;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Resource ID is required' });
    }
    
    // Get authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Verify token
    try {
      const token = authHeader.split(' ')[1];
      jwt.verify(token, process.env.JWT_SECRET as string);
      
      // Find resource with populated data
      const resource = await Resource.findById(id)
        .populate('likedBy', 'fullName email department')
        .populate({
          path: 'comments.author',
          select: 'fullName email department'
        });
      
      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }
      
      // Fetch all view activities for this resource
      const viewActivities = await Activity.find({
        resource: resource._id,
        type: 'view'
      }).populate('user', 'fullName email department');
      
      // Fetch all like activities for this resource
      const likeActivities = await Activity.find({
        resource: resource._id,
        type: 'like'
      }).populate('user', 'fullName email department');
      
      // Generate daily views data from actual activities
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      
      const dailyActivityData = [];
      
      // Generate 7 days of data
      for (let i = 0; i <= 6; i++) {
        const currentDate = new Date(sevenDaysAgo);
        currentDate.setDate(sevenDaysAgo.getDate() + i);
        
        const nextDate = new Date(currentDate);
        nextDate.setDate(currentDate.getDate() + 1);
        
        // Count activities for this day
        const dayCount = viewActivities.filter(activity => {
          const activityDate = new Date(activity.timestamp);
          return activityDate >= currentDate && activityDate < nextDate;
        }).length;
        
        dailyActivityData.push({
          date: currentDate.toISOString().split('T')[0],
          count: dayCount
        });
      }
      
      // Use real activity data or fallback to what's in the resource
      const dailyViews = dailyActivityData.length > 0 ? 
        dailyActivityData : 
        (resource.stats?.dailyViews || []);
      
      // Generate department distribution from activities
      const departmentDistribution: Record<string, number> = {};
      viewActivities.forEach(activity => {
        if (activity.user && activity.user.department) {
          const dept = activity.user.department;
          departmentDistribution[dept] = (departmentDistribution[dept] || 0) + 1;
        }
      });
      
      // Get the real counts based on activity records
      const uniqueViewers = new Set(viewActivities.map(a => a.user?._id?.toString()).filter(Boolean)).size;
      
      // Create an analytics object with the real data
      const analyticsData = {
        views: resource.stats?.views || 0,
        downloads: resource.stats?.downloads || 0,
        likes: resource.stats?.likes || 0,
        comments: (resource.comments || []).length,
        
        // User data from likedBy and like activities 
        likedBy: likeActivities.length > 0 ? 
          likeActivities.map(activity => activity.user) : 
          resource.likedBy || [],
        
        // Comment details
        commentDetails: resource.comments || [],
        
        // Daily views data - use real data from activities
        dailyViews: dailyViews,
        
        // Department distribution from real data
        departmentDistribution: Object.entries(departmentDistribution).map(([name, count]) => ({ 
          name, 
          count 
        })) || [],
        
        // Unique viewers based on actual activities
        uniqueViewers: uniqueViewers || 0,
        
        // Add viewed timestamps
        viewedBy: viewActivities.map(activity => ({
          user: activity.user,
          timestamp: activity.timestamp
        }))
      };
      
      return res.status(200).json(analyticsData);
      
    } catch (error) {
      console.error('JWT verification error:', error);
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Error fetching resource analytics:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
