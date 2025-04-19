
import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../lib/db/connect';
import { Resource } from '../../../lib/db/models/Resource';
import { verifyToken } from '../../../lib/auth/jwt';
import { runCorsMiddleware } from '../_middleware';
import mongoose from 'mongoose';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Apply CORS middleware
    await runCorsMiddleware(req, res);
    
    // Connect to the database
    await connectDB();
    
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Verify token
    const token = authHeader.split(' ')[1];
    let userData;
    try {
      userData = verifyToken(token);
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Ensure user is faculty or admin - debugging info
    console.log('User data from token:', userData);
    
    // Check if user data exists
    if (!userData || !userData.userId) {
      return res.status(403).json({ error: 'Access denied. Invalid user data.' });
    }

    // Get user from database to check role
    const User = mongoose.models.User;
    const user = await User.findById(userData.userId);
    
    if (!user) {
      return res.status(403).json({ error: 'User not found.' });
    }
    
    // Check if user has the right role
    if (user.role !== 'faculty' && user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Only faculty can view faculty resources.' });
    }

    // Find all resources uploaded by this faculty member
    // Use the userId from the verified token
    const resources = await Resource.find({
      uploadedBy: userData.userId,
    })
    .sort({ createdAt: -1 })
    .populate('uploadedBy', 'fullName')
    .limit(50);

    console.log(`Found ${resources.length} resources for user ${userData.userId}`);
    return res.status(200).json({ resources });
  } catch (error) {
    console.error('Error fetching faculty resources:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}
