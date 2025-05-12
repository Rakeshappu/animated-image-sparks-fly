
import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../../lib/db/connect.ts';
import { EligibleUSN } from '../../../../lib/db/models/EligibleUSN.ts';
import { User } from '../../../../lib/db/models/User.ts';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import { checkAdminInDatabase } from '../../_middleware.ts';

// CORS middleware with improved origins and headers
const corsMiddleware = cors({
  origin: ['http://localhost:8080', 'http://localhost:5173', 'http://localhost:3000', '*'],
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS', 'PUT', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
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
  // Set CORS headers manually for OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    return res.status(200).end();
  }

  try {
    // Handle CORS for all other requests
    await runMiddleware(req, res, corsMiddleware);
    await connectDB();
    
    // Get authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('No authorization header or invalid format for eligible-usns API');
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Get JWT token from header
    const token = authHeader.split(' ')[1];
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-for-development';
    
    try {
      // Verify and decode the token
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string, role?: string };
      console.log('Token verification successful for eligible-usns API');
      console.log('User ID from token:', decoded.userId);
      console.log('User role from token:', decoded.role);
      
      // Check admin role - first from token, then from database as fallback
      if (decoded.role !== 'admin') {
        console.log('Token missing admin role, checking database...');
        const isAdmin = await checkAdminInDatabase(decoded.userId);
        if (!isAdmin) {
          console.error(`Access denied for user ${decoded.userId} - not an admin`);
          return res.status(403).json({ 
            error: 'Admin access required',
            message: 'Your token does not contain admin role information. Please log out and log back in.'
          });
        }
        console.log('Admin role verified from database for:', decoded.userId);
      } else {
        console.log('Admin role verified from token for:', decoded.userId);
      }
      
      // GET - List all eligible USNs
      if (req.method === 'GET') {
        const { department, semester, isUsed } = req.query;
        
        // Build filter object
        const filter: any = {};
        
        if (department) filter.department = department;
        if (semester) filter.semester = parseInt(semester as string);
        if (isUsed !== undefined) filter.isUsed = isUsed === 'true';
        
        console.log('Fetching eligible USNs with filter:', filter);
        const eligibleUSNs = await EligibleUSN.find(filter).sort({ createdAt: -1 });
        console.log(`Found ${eligibleUSNs.length} eligible USNs`);
        
        return res.status(200).json({ eligibleUSNs });
      }
      
      // POST - Create new eligible USN
      if (req.method === 'POST') {
        const { usn, department, semester } = req.body;
        
        if (!usn || !department || !semester) {
          return res.status(400).json({ error: 'USN, department, and semester are required' });
        }
        
        // Check if USN already exists
        const existingUSN = await EligibleUSN.findOne({ usn: usn.toUpperCase() });
        if (existingUSN) {
          return res.status(400).json({ error: 'USN already exists' });
        }
        
        // Create new eligible USN
        const newEligibleUSN = new EligibleUSN({
          usn: usn.toUpperCase(),
          department,
          semester: parseInt(semester as string),
          createdBy: decoded.userId
        });
        
        await newEligibleUSN.save();
        console.log('Created new eligible USN:', newEligibleUSN.usn);
        
        return res.status(201).json({ 
          success: true, 
          message: 'Eligible USN created successfully',
          eligibleUSN: newEligibleUSN
        });
      }
      
      // DELETE - Delete all eligible USNs (only for testing)
      if (req.method === 'DELETE') {
        const { all } = req.query;
        
        if (all === 'true') {
          await EligibleUSN.deleteMany({});
          console.log('All eligible USNs deleted');
          return res.status(200).json({ success: true, message: 'All eligible USNs deleted' });
        } else {
          return res.status(400).json({ error: 'Specify ?all=true to delete all eligible USNs' });
        }
      }
      
      return res.status(405).json({ error: 'Method not allowed' });
    } catch (jwtError) {
      console.error('JWT verification failed for eligible-usns API:', jwtError);
      return res.status(401).json({ error: 'Invalid or expired token', details: jwtError.message });
    }
  } catch (error) {
    console.error('Error managing eligible USNs:', error);
    return res.status(500).json({ error: 'Internal server error', details: String(error) });
  }
}
