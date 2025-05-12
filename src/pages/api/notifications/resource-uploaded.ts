
import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../lib/db/connect.ts';
import { notifyResourceUpload } from '../../../lib/realtime/socket.ts';
import jwt from 'jsonwebtoken';
import { User } from '../../../lib/db/models/User.ts';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
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
      decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
      if (!decoded || !decoded.userId) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    } catch (tokenError) {
      console.error('Token verification error:', tokenError);
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify the user is a faculty member
    if (user.role !== 'faculty' && user.role !== 'admin') {
      return res.status(403).json({ error: 'Only faculty members can send resource notifications' });
    }
    
    const { resourceId, facultyName, resourceTitle, semester } = req.body;
    
    if (!resourceId) {
      return res.status(400).json({ error: 'Resource ID is required' });
    }
    
    console.log(`API route: sending notification for resource ${resourceId} by ${facultyName || user.fullName} for semester ${semester}`);
    
    // Explicitly await the notification process to complete
    try {
      await notifyResourceUpload(
        resourceId, 
        facultyName || user.fullName, 
        resourceTitle, 
        semester
      );
      
      console.log(`Real-time notification sent successfully for resource ${resourceId} to semester ${semester || 'all'}`);
      
      return res.status(200).json({
        success: true,
        message: `Notification sent successfully to semester ${semester || 'all'}`,
      });
    } catch (notifyError) {
      console.error('Error in notification process:', notifyError);
      return res.status(500).json({ 
        error: 'Failed to send notification', 
        details: (notifyError as Error).message 
      });
    }
  } catch (error) {
    console.error('Error sending resource notification:', error);
    return res.status(500).json({ error: 'Internal server error', details: (error as Error).message });
  }
}
