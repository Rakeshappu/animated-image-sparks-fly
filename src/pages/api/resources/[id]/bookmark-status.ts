import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../../lib/db/connect.ts';
import { Bookmark } from '../../../../lib/db/models/Bookmark.ts';
import { verifyToken } from '../../../../lib/auth/jwt.ts';

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
    
    // Check if the resource is bookmarked by the user
    const bookmark = await Bookmark.findOne({ userId, resourceId });
    
    return res.status(200).json({ isBookmarked: !!bookmark });
  } catch (error) {
    console.error('Error checking bookmark status:', error);
    return res.status(500).json({ error: 'Internal server error', details: (error as Error).message });
  }
}