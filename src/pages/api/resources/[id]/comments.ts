
import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../../lib/db/connect.ts';
import { Resource } from '../../../../lib/db/models/Resource.ts';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { notifyFacultyOfInteraction } from '../../../../lib/realtime/socket.ts';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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
    
    // GET method - Retrieve comments
    if (req.method === 'GET') {
      const resource = await Resource.findById(id)
        .select('comments')
        .populate('comments.author', 'fullName avatar');
      
      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }
      
      return res.status(200).json({
        success: true,
        comments: resource.comments || []
      });
    }
    
    // POST method - Add comment
    if (req.method === 'POST') {
      const { content } = req.body;
      
      if (!content || typeof content !== 'string') {
        return res.status(400).json({ error: 'Comment content is required' });
      }
      
      const resource = await Resource.findById(id);
      
      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }
      
      // Create ObjectId for user
      const authorId = new mongoose.Types.ObjectId(decoded.userId);
      
      // Initialize comments array if it doesn't exist
      if (!resource.comments) {
        resource.comments = [];
      }
      
      // Add comment
      const newComment = {
        content,
        author: authorId,
        createdAt: new Date()
      };
      
      resource.comments.push(newComment);
      
      // Update comment count in stats
      if (!resource.stats) {
        resource.stats = {
          views: 0,
          downloads: 0,
          likes: 0,
          comments: 0,
          lastViewed: new Date()
        };
      }
      
      resource.stats.comments = (resource.stats.comments || 0) + 1;
      
      await resource.save();
      
      // Notify faculty if a student comments on their resource
      // Only if the comment author is not the resource owner
      if (resource.uploadedBy && resource.uploadedBy.toString() !== decoded.userId) {
        notifyFacultyOfInteraction(id, decoded.userId, 'comment', content);
      }
      
      // Return the newly created comment
      const updatedResource = await Resource.findById(id)
        .select('comments')
        .populate('comments.author', 'fullName avatar');
      
      const addedComment = updatedResource?.comments?.slice(-1)[0];
      
      return res.status(201).json({
        success: true,
        comment: addedComment
      });
    }
    
    // DELETE method - Remove comment
    if (req.method === 'DELETE') {
      const { commentId } = req.body;
      
      if (!commentId) {
        return res.status(400).json({ error: 'Comment ID is required' });
      }
      
      const resource = await Resource.findById(id);
      
      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }
      
      // Find comment index
      const commentIndex = resource.comments?.findIndex(
        (comment: any) => comment._id.toString() === commentId && 
                         (comment.author.toString() === decoded.userId || resource.uploadedBy?.toString() === decoded.userId)
      );
      
      if (commentIndex === undefined || commentIndex === -1) {
        return res.status(403).json({ 
          error: 'Comment not found or you do not have permission to delete it'
        });
      }
      
      // Remove comment
      resource.comments.splice(commentIndex, 1);
      
      // Update comment count in stats
      if (resource.stats && resource.stats.comments) {
        resource.stats.comments = Math.max(0, resource.stats.comments - 1);
      }
      
      await resource.save();
      
      return res.status(200).json({
        success: true,
        message: 'Comment deleted successfully'
      });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error handling comment:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
