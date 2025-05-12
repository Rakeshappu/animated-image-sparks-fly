
import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../../lib/db/connect.ts';
import { Resource } from '../../../../lib/db/models/Resource.ts';
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
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
    
    // Find resource
    const resource = await Resource.findById(id);
    
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    
    // Check if user has liked this resource
    const isLiked = resource.likedBy && resource.likedBy.some((userId: any) => userId.toString() === decoded.userId);
    
    return res.status(200).json({ isLiked });
  } catch (error) {
    console.error('Error checking like status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
