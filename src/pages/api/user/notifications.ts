
import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../lib/db/connect.ts';
import { User } from '../../../lib/db/models/User.ts';
import { Notification } from '../../../lib/db/models/Notification.ts';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
    
    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // GET method - Retrieve notifications
    if (req.method === 'GET') {
      // Get notifications for this user from the Notification model
      const notifications = await Notification.find({ userId: user._id })
        .sort({ createdAt: -1 })
        .limit(50);
      
      return res.status(200).json({
        success: true,
        notifications: notifications
      });
    }
    
    // PUT method - Mark notifications as read
    if (req.method === 'PUT') {
      const { notificationIds, markAll } = req.body;
      
      if (markAll) {
        // Mark all notifications as read
        await Notification.updateMany(
          { userId: user._id, read: false },
          { $set: { read: true } }
        );
      } else if (notificationIds && Array.isArray(notificationIds)) {
        // Mark specific notifications as read
        await Notification.updateMany(
          { 
            userId: user._id, 
            _id: { $in: notificationIds.map(id => new mongoose.Types.ObjectId(id)) },
            read: false
          },
          { $set: { read: true } }
        );
      }
      
      // Get updated notifications
      const updatedNotifications = await Notification.find({ userId: user._id })
        .sort({ createdAt: -1 })
        .limit(50);
      
      return res.status(200).json({
        success: true,
        message: 'Notifications updated successfully',
        notifications: updatedNotifications
      });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Notification handling error:', error);
    return res.status(500).json({ error: 'Internal server error', details: (error as Error).message });
  }
}
