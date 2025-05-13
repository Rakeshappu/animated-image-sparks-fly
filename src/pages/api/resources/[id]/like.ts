
import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../../lib/db/connect';
import { Resource } from '../../../../lib/db/models/Resource';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { notifyFacultyOfInteraction } from '../../../../lib/realtime/socket';

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
    let decoded;
    try {
      const token = authHeader.split(' ')[1];
      decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
    } catch (error) {
      console.error('JWT verification error:', error);
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ error: 'Invalid token format' });
    }
    
    // Get the like action - if not provided, we'll toggle
    const { like } = req.body;
    
    console.log(`Like request for resource ${id} by user ${decoded.userId}, action: ${like !== undefined ? like : 'toggle'}`);
    
    // Find resource
    const resource = await Resource.findById(id);
    
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    
    // Initialize likedBy array if it doesn't exist
    if (!resource.likedBy) {
      resource.likedBy = [];
    }
    
    // Initialize stats if they don't exist
    if (!resource.stats) {
      resource.stats = {
        views: 0,
        downloads: 0,
        likes: 0,
        comments: 0,
        lastViewed: new Date(),
        dailyViews: [],
        studentFeedback: []
      };
    }
    
    // Convert userId to ObjectId for consistent comparison
    const userId = new mongoose.Types.ObjectId(decoded.userId);
    
    // Find if user has already liked this resource
    const userLikedIndex = resource.likedBy.findIndex(
      (id: any) => id.toString() === decoded.userId
    );
    
    const isLiked = userLikedIndex !== -1;
    const shouldLike = like !== undefined ? like : !isLiked;
    
    console.log(`User ${decoded.userId} has ${isLiked ? 'already liked' : 'not liked'} this resource.`);
    console.log(`Action to take: ${shouldLike ? 'like' : 'unlike'}`);
    
    // Calculate the exact like count from the likedBy array
    let likesCount = resource.likedBy.length;
    
    if (shouldLike && !isLiked) {
      // Add user to likedBy if not already present
      resource.likedBy.push(userId);
      likesCount += 1;
      
      console.log(`Adding user ${decoded.userId} to likedBy array. New count: ${likesCount}`);
      
      // Send notification to faculty if a student likes their resource
      // Only send notification when a resource is liked, not unliked
      if (resource.uploadedBy && resource.uploadedBy.toString() !== decoded.userId) {
        try {
          await notifyFacultyOfInteraction(id, decoded.userId, 'like');
        } catch (notifyError) {
          console.error('Error sending faculty notification:', notifyError);
          // Continue even if notification fails
        }
      }
    } else if (!shouldLike && isLiked) {
      // Remove user from likedBy
      resource.likedBy.splice(userLikedIndex, 1);
      likesCount = Math.max(0, likesCount - 1); // Prevent negative likes
      
      console.log(`Removing user ${decoded.userId} from likedBy array. New count: ${likesCount}`);
    } else {
      console.log(`No change needed for like status. Current count: ${likesCount}`);
    }
    
    // Update the stats.likes to match the actual count of likedBy
    resource.stats.likes = likesCount;
    
    // Save the updated resource
    await resource.save();
    
    console.log(`Resource like status updated. Final count: ${likesCount}, User liked: ${shouldLike}`);
    
    return res.status(200).json({ 
      success: true,
      message: shouldLike ? 'Resource liked' : 'Resource unliked',
      likesCount: likesCount,
      isLiked: shouldLike
    });
  } catch (error) {
    console.error('Error updating like status:', error);
    return res.status(500).json({ error: 'Internal server error', details: (error as Error)?.message });
  }
}
