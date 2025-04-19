
import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../../lib/db/connect';
import { User } from '../../../../lib/db/models/User';
import jwt from 'jsonwebtoken';

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
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string, role: string };
    
    // Ensure the user is an admin
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    // Get user ID and verify action from request body
    const { userId, verify } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update verification status
    if (verify === true) {
      await user.verifyByAdmin();
      
      // Send notification to user
      await user.addNotification({
        message: 'Your account has been verified by an administrator. You now have full access to the platform.'
      });
      
      return res.status(200).json({ 
        success: true, 
        message: 'User verified successfully',
        user: {
          _id: user._id,
          isAdminVerified: user.isAdminVerified
        }
      });
    } else {
      await user.unverifyByAdmin();
      
      // Send notification to user
      await user.addNotification({
        message: 'Your account verification has been revoked by an administrator. Some features may be restricted.'
      });
      
      return res.status(200).json({ 
        success: true, 
        message: 'User unverified successfully',
        user: {
          _id: user._id,
          isAdminVerified: user.isAdminVerified
        }
      });
    }
  } catch (error) {
    console.error('User verification error:', error);
    return res.status(500).json({ error: 'Internal server error', details: (error as Error).message });
  }
}
