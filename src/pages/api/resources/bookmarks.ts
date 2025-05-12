
import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../lib/db/connect.ts';
import { Resource } from '../../../lib/db/models/Resource.ts';
import { Bookmark } from '../../../lib/db/models/Bookmark.ts';
import { verifyToken } from '../../../lib/auth/jwt.ts';

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
    const bookmarks = await Bookmark.find({ userId });
    
    if (!bookmarks || bookmarks.length === 0) {
      return res.status(200).json({ resources: [] });
    }
    
    // Extract resource IDs
    const resourceIds = bookmarks.map(bookmark => bookmark.resourceId);
    
    // Fetch the resources
    const resources = await Resource.find({ _id: { $in: resourceIds } })
      .sort({ createdAt: -1 });
    
    // Add a bookmarked flag to each resource
    const bookmarkedResources = resources.map(resource => ({
      ...resource.toObject(),
      isBookmarked: true
    }));
    
    return res.status(200).json({ resources: bookmarkedResources });
  } catch (error) {
    console.error('Error fetching bookmarked resources:', error);
    return res.status(500).json({ error: 'Internal server error', details: (error as Error).message });
  }
}
