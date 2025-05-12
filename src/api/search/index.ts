
import { Request, Response } from 'express';
import { searchResources } from '../../lib/search/elasticsearch.ts';
import { getCache, setCache } from '../../lib/cache/redis.ts';
import connectDB from '../../lib/db/connect.ts';
import { elasticsearchConfig } from '../../lib/config/services.ts';
import mongoose from 'mongoose';

// Import or define the Resource model explicitly to avoid the implicit any type
const ResourceModel = mongoose.model('Resource');

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    // Extract query parameters
    const {
      q = '',
      type,
      subject,
      semester,
      department,
      page = '1',
      limit = '10',
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    // Check if Elasticsearch is configured
    if (!elasticsearchConfig.isConfigured()) {
      console.log('Elasticsearch not configured, using fallback search');
      return fallbackSearch(req, res);
    }

    // Try to get results from cache first
    const cacheKey = `search:${q}:${type || ''}:${subject || ''}:${semester || ''}:${department || ''}:${page}:${limit}:${sort}:${order}`;
    const cachedResults = await getCache(cacheKey);
    
    if (cachedResults) {
      return res.status(200).json(cachedResults);
    }

    // Build filters
    const filters: Record<string, any> = {};
    if (type) filters.type = type;
    if (subject) filters.subject = subject;
    if (semester) filters.semester = parseInt(semester as string);
    if (department) filters.department = department;

    // Execute search
    const results = await searchResources({
      query: q as string,
      filters,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      sort: { [sort as string]: order as 'asc' | 'desc' }
    });

    // Cache results for 5 minutes
    await setCache(cacheKey, results, 300);

    res.status(200).json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' });
  }
}

// Fallback search implementation using MongoDB for when Elasticsearch is not available
async function fallbackSearch(req: Request, res: Response) {
  const {
    q = '',
    type,
    subject,
    semester,
    department,
    page = '1',
    limit = '10',
    sort = 'createdAt',
    order = 'desc'
  } = req.query;

  try {
    // Build the query
    const query: any = {};
    
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ];
    }
    
    if (type) {
      if (Array.isArray(type)) {
        query.type = { $in: type };
      } else {
        query.type = type;
      }
    }

    if (subject) query.subject = subject;
    if (semester) query.semester = parseInt(semester as string);
    if (department) query.department = department;
    
    // Execute the search
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;
    
    const sortOption: any = {};
    sortOption[sort as string] = order === 'desc' ? -1 : 1;
    
    // Use ResourceModel to perform the query
    const resources = await ResourceModel.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .lean(); // Use lean to get plain JS objects
    
    const total = await ResourceModel.countDocuments(query);
    
    // Format results to match Elasticsearch response format
    const results = resources.map((resource: any) => ({
      _id: resource._id ? resource._id.toString() : '',
      title: resource.title,
      description: resource.description,
      type: resource.type,
      subject: resource.subject,
      semester: resource.semester,
      uploadedBy: resource.uploadedBy ? resource.uploadedBy.toString() : '',
      department: resource.department || 'ISE',
      createdAt: resource.createdAt,
      updatedAt: resource.updatedAt,
      score: 1, // No scoring in MongoDB fallback
    }));
    
    res.status(200).json({
      results,
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error('Fallback search error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}
