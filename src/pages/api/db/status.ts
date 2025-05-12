
import { NextApiRequest, NextApiResponse } from 'next';
import { verifyDbConnection } from '../../../lib/db/connect';
import cors from 'cors';
import mongoose from 'mongoose';

// Configure CORS for this endpoint
const corsMiddleware = cors({
  origin: function(origin, callback) {
    const allowedOrigins = ['http://localhost:8080', 'http://localhost:3000'];
    // Allow requests with no origin
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
});

// Helper method to run the CORS middleware
function runCorsMiddleware(req: NextApiRequest, res: NextApiResponse) {
  return new Promise((resolve, reject) => {
    corsMiddleware(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Run CORS middleware first
  try {
    await runCorsMiddleware(req, res);
    
    // Handle preflight request
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const status = await verifyDbConnection();
    
    // Add additional information about the MongoDB server if connected
    let serverInfo = {};
    if (status.connected && mongoose.connection) {
      serverInfo = {
        host: mongoose.connection.host,
        name: mongoose.connection.name,
        port: mongoose.connection.port,
        models: Object.keys(mongoose.models)
      };
    }
    
    return res.status(200).json({
      ...status,
      timestamp: new Date().toISOString(),
      serverInfo
    });
  } catch (error) {
    console.error('Error checking database status:', error);
    return res.status(500).json({ 
      connected: false, 
      error: 'Failed to check database connection',
      details: String(error)
    });
  }
}
