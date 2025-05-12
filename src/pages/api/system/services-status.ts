
import { NextApiRequest, NextApiResponse } from 'next';
import { verifyDbConnection } from '../../../lib/db/connect.ts';
import { s3Config, redisConfig, elasticsearchConfig } from '../../../lib/config/services.ts';
import cors from 'cors';

// Configure CORS for this endpoint
const corsMiddleware = cors({
  origin: function(origin, callback) {
    const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8080'];
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
  try {
    // Run CORS middleware first
    await runCorsMiddleware(req, res);
    
    // Handle preflight request
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    // Check MongoDB connection
    const dbStatus = await verifyDbConnection();
    
    // Check other services configuration
    const servicesStatus = {
      database: dbStatus,
      timestamp: new Date().toISOString(),
      aws: {
        s3: {
          configured: s3Config.isConfigured(),
          useFallback: s3Config.useMocks,
          region: s3Config.region
        }
      },
      redis: {
        configured: redisConfig.isConfigured(),
        useFallback: redisConfig.useMocks,
        host: redisConfig.isConfigured() ? redisConfig.host : 'not-configured'
      },
      elasticsearch: {
        configured: elasticsearchConfig.isConfigured(),
        useFallback: elasticsearchConfig.useMocks,
        node: elasticsearchConfig.isConfigured() ? elasticsearchConfig.node : 'not-configured'
      },
      environment: process.env.NODE_ENV
    };
    
    return res.status(200).json(servicesStatus);
  } catch (error) {
    console.error('Error checking services status:', error);
    return res.status(500).json({ 
      error: 'Failed to check services status',
      details: String(error)
    });
  }
}
