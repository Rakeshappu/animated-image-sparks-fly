
import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import connectDB from '../../../lib/db/connect';
import { User } from '../../../lib/db/models/User';
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
    
    // Check for authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-for-development';
    
    try {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string, role: string };
      
      // Find user
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      return res.status(200).json({
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          department: user.department,
          phoneNumber: user.phoneNumber,
          avatar: user.avatar || undefined,
          semester: user.semester || undefined,
          isVerified: !!user.isEmailVerified,
        },
        timestamp: new Date().toISOString()
      });
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
