
import type { NextApiRequest, NextApiResponse } from 'next'
import connectDB from '../../lib/db/connect.js';
import Cors from 'cors';
import jwt from 'jsonwebtoken';
import { User } from '../../lib/db/models/User.js';

type Handler = (req: NextApiRequest, res: NextApiResponse) => Promise<void>

const cors = Cors({
  origin: ['http://localhost:8080', 'http://localhost:5173', 'http://localhost:3000', '*'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
});

// Helper method to wait for a middleware to execute before continuing
export function runCorsMiddleware(req: NextApiRequest, res: NextApiResponse) {
  return new Promise((resolve, reject) => {
    cors(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

// Check admin status in database as fallback
export async function checkAdminInDatabase(userId: string): Promise<boolean> {
  try {
    const user = await User.findById(userId).select('role');
    return user?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status in database:', error);
    return false;
  }
}

// Verify JWT token
export function verifyAuthToken(token: string) {
  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-for-development';
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

export const withDB = (handler: Handler) => async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    // Set CORS headers directly for preflight requests
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,PUT,OPTIONS,PATCH');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
      res.status(200).end();
      return;
    }
    
    await runCorsMiddleware(req, res);
    await connectDB();
    
    // Log each API request for debugging
    console.log(`API ${req.method} request to ${req.url} with auth: ${req.headers.authorization ? 'Yes' : 'No'}`);
    
    // For admin routes, check token and database as fallback
    if (req.url?.includes('/api/admin/')) {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required for admin routes' });
      }
      
      const token = authHeader.split(' ')[1];
      const decoded = verifyAuthToken(token) as { userId: string, role?: string } | null;
      
      if (!decoded) {
        return res.status(401).json({ error: 'Invalid authentication token' });
      }
      
      console.log(`Admin route access attempt: ${req.url} by user ${decoded.userId} with role from token: ${decoded.role || 'undefined'}`);
      
      // Check if token has admin role
      if (decoded.role === 'admin') {
        console.log('Admin access verified from token');
        return handler(req, res);
      }
      
      // If token doesn't have admin role, check database as fallback
      const isAdminInDB = await checkAdminInDatabase(decoded.userId);
      if (isAdminInDB) {
        console.log('Admin access verified from database (token role missing)');
        // Enhance the request by adding the role that was missing in the token
        (decoded as any).role = 'admin';
        return handler(req, res);
      }
      
      console.error(`Admin access denied for user ${decoded.userId}`);
      return res.status(403).json({ 
        error: 'Admin access required',
        message: 'Your token does not contain admin role information. Please log out and log back in.'
      });
    }
    
    return handler(req, res);
  } catch (error) {
    console.error('API route error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,PUT,OPTIONS,PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.status(200).end();
    return;
  }
  
  await runCorsMiddleware(req, res);
  return res;
}
