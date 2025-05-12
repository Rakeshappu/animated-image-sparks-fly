
import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../../lib/db/connect.ts';
import { User } from '../../../../lib/db/models/User.ts';
import jwt from 'jsonwebtoken';
import { runCorsMiddleware } from '../../_middleware.ts';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }
  
  // Apply CORS middleware
  await runCorsMiddleware(req, res);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    await connectDB();
    
    // Get authorization header
    const authHeader = req.headers.authorization;
    console.log('Auth header received:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Verify token
    const token = authHeader.split(' ')[1];
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-for-development';
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string, role: string };
      console.log('Token verified, decoded:', { userId: decoded.userId, role: decoded.role });
      
      // Ensure the user is an admin
      if (decoded.role !== 'admin') {
        // Check database as fallback
        const adminUser = await User.findById(decoded.userId).select('role');
        if (!adminUser || adminUser.role !== 'admin') {
          console.log('User is not admin:', decoded.userId, 'Role:', decoded.role);
          return res.status(403).json({ error: 'Not authorized' });
        }
        console.log('Admin confirmed in database:', adminUser._id);
      }
      
      // Get user ID and verify action from request body
      const { userId, verify } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      
      console.log('Processing verification for user:', userId, 'Setting to:', verify);
      
      // Find user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Update verification status
      if (verify === true) {
        user.isAdminVerified = true;
        await user.save();
        
        // Send notification to user if available
        if (user.addNotification && typeof user.addNotification === 'function') {
          await user.addNotification({
            message: 'Your account has been verified by an administrator. You now have full access to the platform.'
          });
        }
        
        return res.status(200).json({ 
          success: true, 
          message: 'User verified successfully',
          user: {
            _id: user._id,
            isAdminVerified: user.isAdminVerified
          }
        });
      } else {
        user.isAdminVerified = false;
        await user.save();
        
        // Send notification to user if available
        if (user.addNotification && typeof user.addNotification === 'function') {
          await user.addNotification({
            message: 'Your account verification has been revoked by an administrator. Some features may be restricted.'
          });
        }
        
        return res.status(200).json({ 
          success: true, 
          message: 'User unverified successfully',
          user: {
            _id: user._id,
            isAdminVerified: user.isAdminVerified
          }
        });
      }
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return res.status(401).json({ error: 'Invalid token', details: (jwtError as Error).message });
    }
  } catch (error) {
    console.error('User verification error:', error);
    return res.status(500).json({ error: 'Internal server error', details: (error as Error).message });
  }
}
