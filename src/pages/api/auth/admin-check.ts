
import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import connectDB from '../../../lib/db/connect.ts';
import { User } from '../../../lib/db/models/User.ts';
import cors from 'cors';

// CORS middleware
const corsMiddleware = cors({
  origin: ['http://localhost:8080', 'http://localhost:5173', 'http://localhost:3000', '*'],
  credentials: true,
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

// Run middleware helper
const runMiddleware = (req: NextApiRequest, res: NextApiResponse, fn: Function) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Apply CORS middleware
    await runMiddleware(req, res, corsMiddleware);
    await connectDB();
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-for-development';

    // Decode and verify JWT token
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string, role?: string };
      console.log('Token verification successful for admin-check API. Payload:', decoded);
      
      // Get user from database for verification
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Verify admin status - check both token and database
      // This provides two layers of security
      const tokenRole = decoded.role;
      const dbRole = user.role;
      
      console.log('Admin check - Token role:', tokenRole, 'DB role:', dbRole);
      
      // Check if either source confirms admin status
      const isAdmin = tokenRole === 'admin' || dbRole === 'admin';
      
      if (!isAdmin) {
        console.error(`Admin access denied for user with roles - Token: ${tokenRole}, DB: ${dbRole}`);
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      // If user has admin role in DB but not in token, provide a response that suggests re-login
      if (dbRole === 'admin' && tokenRole !== 'admin') {
        return res.status(200).json({
          message: 'You have admin access in the database but not in your current session token. Please re-login.',
          user: {
            userId: decoded.userId,
            tokenRole: tokenRole,
            dbRole: dbRole,
            email: user.email,
            fullName: user.fullName
          },
          needsRelogin: true,
          timestamp: new Date().toISOString()
        });
      }
      
      res.status(200).json({
        message: 'You have admin access',
        user: {
          userId: decoded.userId,
          role: 'admin',
          email: user.email,
          fullName: user.fullName
        },
        timestamp: new Date().toISOString()
      });
    } catch (jwtError) {
      console.error('JWT verification failed in admin-check:', jwtError);
      return res.status(401).json({ error: 'Invalid or expired token', details: jwtError.message });
    }
  } catch (error) {
    console.error('Error in admin-check handler:', error);
    res.status(500).json({ error: 'Internal server error', details: String(error) });
  }
}
