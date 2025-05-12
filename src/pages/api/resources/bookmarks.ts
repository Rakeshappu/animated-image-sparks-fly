
import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../lib/db/connect';
import { Resource } from '../../../lib/db/models/Resource';
import { Bookmark } from '../../../lib/db/models/Bookmark';
import { verifyToken } from '../../../lib/auth/jwt';
import { mongoDocToPlain } from '../../../lib/db/converters';

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
    
    // Get all bookmarks for the user
    const bookmarks = await Bookmark.find({ user: userId })
      .populate('resource')
      .sort({ createdAt: -1 })
      .lean();
    
    if (!bookmarks || bookmarks.length === 0) {
      return res.status(200).json({ resources: [] });
    }
    
    // Transform bookmark data for the response
    const bookmarksData = bookmarks.map((bookmark) => {
      const resource = mongoDocToPlain(bookmark.resource);
      if (!resource) return null;
      
      return {
        bookmarkId: bookmark._id.toString(),
        resourceId: resource._id.toString(),
        title: resource.title,
        description: resource.description,
        type: resource.type,
        subject: resource.subject,
        semester: resource.semester,
        createdAt: bookmark.createdAt,
        fileUrl: resource.fileUrl,
        stats: resource.stats || { views: 0, downloads: 0, likes: 0, comments: 0 }
      };
    }).filter(Boolean);
    
    return res.status(200).json({ resources: bookmarksData });
  } catch (error) {
    console.error('Error fetching bookmarked resources:', error);
    return res.status(500).json({ error: 'Internal server error', details: (error as Error).message });
  }
}
