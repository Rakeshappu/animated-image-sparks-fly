
import express from 'express';
import connectDB from '../../lib/db/connect.js';
import mongoose from 'mongoose';
import { verifyToken } from '../../lib/auth/jwt.js';

const router = express.Router();

// Create notifications model reference if it doesn't exist
const Notification = mongoose.models.Notification || mongoose.model('Notification', new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  type: { type: String, default: 'info' },
  resourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource' },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}));

// Get notifications for the authenticated user
router.get('/notifications', async (req, res) => {
  try {
    await connectDB();
    
    // Get authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Verify token
    const token = authHeader.split(' ')[1];
    let userData:any;
    try {
      userData = verifyToken(token);
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    // Get user from database to check if exists
    const User = mongoose.models.User;
    const user = await User.findById(userData.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get notifications for this user
    const notifications = await Notification.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();
    
    return res.status(200).json({
      success: true,
      notifications: notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark notifications as read
router.put('/notifications', async (req, res) => {
  try {
    await connectDB();
    
    // Get authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Verify token
    const token = authHeader.split(' ')[1];
    let userData:any;
    try {
      userData = verifyToken(token);
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    const { notificationIds, markAll } = req.body;
    
    if (markAll) {
      // Mark all notifications as read
      await Notification.updateMany(
        { userId: userData.userId, read: false },
        { $set: { read: true } }
      ).exec();
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      await Notification.updateMany(
        { 
          userId: userData.userId, 
          _id: { $in: notificationIds.map(id => new mongoose.Types.ObjectId(id)) },
          read: false
        },
        { $set: { read: true } }
      ).exec();
    }
    
    // Get updated notifications
    const updatedNotifications = await Notification.find({ userId: userData.userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();
    
    return res.status(200).json({
      success: true,
      message: 'Notifications updated successfully',
      notifications: updatedNotifications
    });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
