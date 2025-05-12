
import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../lib/db/connect';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// Create a schema for search history if it doesn't exist
const SearchHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  query: {
    type: String,
    required: true,
  },
  source: {
    type: String,
    enum: ['serper', 'internal', 'other'],
    default: 'internal',
  },
  results: {
    type: Number,
    default: 0,
  },
  category: {
    type: String,
    default: 'general',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Check if the model exists before creating it
const SearchHistory = mongoose.models.SearchHistory || mongoose.model('SearchHistory', SearchHistorySchema);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    await connectDB();
    
    // GET - fetch user's search history
    if (req.method === 'GET') {
      // Get authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      // Verify token
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
      
      // Find search history
      const searchHistory = await SearchHistory.find({ userId: decoded.userId })
        .sort({ timestamp: -1 })
        .limit(20);
      
      return res.status(200).json({ success: true, searchHistory });
    }
    
    // POST - add new search to history
    if (req.method === 'POST') {
      // Get authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      // Verify token
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
      
      // Get search details
      const { query, source, results, category } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }
      
      // Create new search history entry
      const newSearch = await SearchHistory.create({
        userId: decoded.userId,
        query,
        source: source || 'internal',
        results: results || 0,
        category: category || 'general',
        timestamp: new Date()
      });
      
      return res.status(201).json({ success: true, search: newSearch });
    }
    
    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error:any) {
    console.error('Search history API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
