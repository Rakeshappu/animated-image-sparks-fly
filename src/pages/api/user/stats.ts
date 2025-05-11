
import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../lib/db/connect';
import { User } from '../../../lib/db/models/User';
import { Resource } from '../../../lib/db/models/Resource';
import { Activity } from '../../../lib/db/models/Activity';
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
      const JWT_SECRET = process.env.JWT_SECRET as string;
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string, role?: string };
      if (!decoded || !decoded.userId) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    } catch (tokenError) {
      console.error('Token verification error:', tokenError);
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    // Get user statistics
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalFaculty = await User.countDocuments({ role: 'faculty' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalPendingAdmins = await User.countDocuments({ role: 'admin', isAdminVerified: false });
    
    // Get department distribution
    const departments = await User.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const departmentDistribution = departments.map(dept => ({
      name: dept._id || 'Unknown',
      value: dept.count
    }));
    
    // Get recent registrations
    const recentRegistrations = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('fullName email role department createdAt');
    
    // Get total resource counts
    const totalResources = await Resource.countDocuments();
    const resourcesByType = await Resource.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    
    const resourceTypeDistribution = resourcesByType.map(type => ({
      name: type._id || 'Other',
      value: type.count
    }));
    
    // Get activity statistics
    const totalActivities = await Activity.countDocuments();
    const activitiesByType = await Activity.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    
    const activityDistribution = activitiesByType.map(activity => ({
      name: activity._id,
      value: activity.count
    }));
    
    // Get recent activity trends
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    const previousSevenDaysAgo = new Date(sevenDaysAgo);
    previousSevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Current week activities
    const currentWeekActivities = await Activity.countDocuments({
      timestamp: { $gte: sevenDaysAgo }
    });
    
    // Previous week activities
    const previousWeekActivities = await Activity.countDocuments({
      timestamp: { $gte: previousSevenDaysAgo, $lt: sevenDaysAgo }
    });
    
    // Calculate percentage change
    const activityPercentageChange = previousWeekActivities === 0 
      ? 100 // If there were no activities in the previous period, it's a 100% increase
      : Math.round(((currentWeekActivities - previousWeekActivities) / previousWeekActivities) * 100);
    
    // Current week users
    const currentWeekUsers = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });
    
    // Previous week users
    const previousWeekUsers = await User.countDocuments({
      createdAt: { $gte: previousSevenDaysAgo, $lt: sevenDaysAgo }
    });
    
    // Calculate percentage change for users
    const userPercentageChange = previousWeekUsers === 0
      ? 100
      : Math.round(((currentWeekUsers - previousWeekUsers) / previousWeekUsers) * 100);
    
    // Current week resources
    const currentWeekResources = await Resource.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });
    
    // Previous week resources
    const previousWeekResources = await Resource.countDocuments({
      createdAt: { $gte: previousSevenDaysAgo, $lt: sevenDaysAgo }
    });
    
    // Calculate percentage change for resources
    const resourcePercentageChange = previousWeekResources === 0
      ? 100
      : Math.round(((currentWeekResources - previousWeekResources) / previousWeekResources) * 100);
    
    return res.status(200).json({
      success: true,
      totalUsers,
      totalStudents,
      totalFaculty,
      totalAdmins,
      totalPendingAdmins,
      departmentDistribution,
      recentRegistrations,
      totalResources,
      resourceTypeDistribution,
      totalActivities,
      activityDistribution,
      activityPercentageChange,
      userPercentageChange,
      resourcePercentageChange,
      currentWeekActivities,
      previousWeekActivities,
      currentWeekUsers,
      previousWeekUsers,
      currentWeekResources,
      previousWeekResources
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return res.status(500).json({ error: 'Internal server error', details: (error as Error).message });
  }
}
