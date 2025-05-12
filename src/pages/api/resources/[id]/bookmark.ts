
import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../../lib/db/connect.ts';
import { Resource } from '../../../../lib/db/models/Resource.ts';
import { Bookmark } from '../../../../lib/db/models/Bookmark.ts';
import { verifyToken } from '../../../../lib/auth/jwt.ts';
import mongoose from 'mongoose';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    await connectDB();
    
    // Get resource ID from the URL
    const resourceId = req.query.id as string;
    if (!resourceId) {
      return res.status(400).json({ error: 'Resource ID is required' });
    }
    
    // Verify token and get user ID
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    const userId = decoded.userId;
    
    // Check if the resource exists
    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    
    try {
      // Toggle bookmark status
      const result = await Bookmark.toggleBookmark(userId, resourceId);
      
      return res.status(200).json({ 
        success: true,
        bookmarked: result.bookmarked,
        message: result.bookmarked ? 'Resource bookmarked' : 'Resource unbookmarked'
      });
    } catch (error) {
      console.error('Error in toggleBookmark:', error);
      
      // Check for duplicate key error (trying to bookmark the same resource twice)
      if ((error as any).code === 11000) {
        return res.status(409).json({ error: 'Resource already bookmarked' });
      }
      
      throw error; // Re-throw to be caught by the outer catch
    }
  } catch (error) {
    console.error('Error updating bookmark status:', error);
    
    return res.status(500).json({ error: 'Internal server error', details: (error as Error).message });
  }
}
