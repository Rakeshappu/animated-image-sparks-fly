
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';
import { User } from '../../lib/db/models/User';
import mongoose from 'mongoose';

// Extend the Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Main authentication middleware
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      console.log('No authorization token found in request');
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = verifyToken(token);
    
    if (!decoded) {
      console.log('Invalid token provided');
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Add user info to request object
    req.user = decoded;
    
    // Log successful authentication with more details
    console.log(`Authenticated user: ${decoded.userId} with role: ${decoded.role || 'undefined'}`);
    
    next();
  } catch (error: any) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Invalid token', message: error.message });
  }
};

// Admin-only middleware - reuse this for admin routes
export const adminMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // First apply the auth middleware to verify the token
  authMiddleware(req, res, async (err) => {
    if (err) {
      return next(err);
    }
    
    // Log the user role for debugging
    console.log('Checking admin access:', req.user?.role);
    
    if (!req.user) {
      console.error('Admin access denied: No user found in request');
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    // Check if user has admin role in token
    if (req.user.role === 'admin') {
      console.log('Admin access granted from token for user:', req.user.userId);
      return next();
    }
    
    // Fallback: If token doesn't have role, check database
    try {
      // Check against database to see if this user should have admin access
      if (mongoose.connection.readyState === 1) { // Only check if database is connected
        const user = await User.findById(req.user.userId).select('role');
        
        if (user && user.role === 'admin') {
          console.log('Admin access granted from database for user:', req.user.userId);
          // Note: We're not updating the token here, but allowing access
          req.user.role = 'admin'; // Add role to request for downstream middleware
          return next();
        }
      }
      
      console.error(`Admin access denied for user with role: ${req.user.role || 'undefined'}`);
      return res.status(403).json({ 
        error: 'Admin access required',
        message: 'Your token does not contain admin role information. Please log out and log back in.'
      });
    } catch (dbError) {
      console.error('Error checking admin status in database:', dbError);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
};

// Faculty-only middleware
export const facultyMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // First apply the auth middleware to verify the token
  authMiddleware(req, res, (err) => {
    if (err) {
      return next(err);
    }
    
    // Log the user role for debugging
    console.log('Checking faculty access:', req.user?.role);
    
    if (!req.user || (req.user.role !== 'faculty' && req.user.role !== 'admin')) {
      console.error(`Faculty access denied for user with role: ${req.user?.role || 'undefined'}`);
      return res.status(403).json({ error: 'Faculty access required' });
    }
    
    console.log('Faculty access granted for user:', req.user.userId);
    next();
  });
};
