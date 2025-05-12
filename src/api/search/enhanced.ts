import { Request, Response } from 'express';
import { searchResources } from '../../lib/search/elasticsearch.ts';
import { getCache, setCache } from '../../lib/cache/redis.ts';
import connectDB from '../../lib/db/connect.ts';
import { localMemoryCache } from '../../lib/cache/local-memory-cache.ts';
import { generateText } from '../../services/openai.service.ts';
import serperService from '../../services/serper.service.ts';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    // Extract query parameters
    const {
      q = '',
      type = 'educational',
      page = '1',
      limit = '10',
      recency = 'any',
      contentType = 'all'
    } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    // Create a cache key based on all parameters
    const cacheKey = `search:enhanced:${q}:${type}:${page}:${limit}:${recency}:${contentType}`;

    // Try to get results from cache first
    try {
      // Try Redis first if configured
      const cachedResults = await getCache(cacheKey);
      if (cachedResults) {
        console.log('Returning cached enhanced search results from Redis');
        return res.status(200).json(cachedResults);
      }
      
      // Fallback to local memory cache
      const localCachedResults = await localMemoryCache.get(cacheKey);
      if (localCachedResults) {
        console.log('Returning cached enhanced search results from local memory');
        return res.status(200).json(localCachedResults);
      }
    } catch (error) {
      console.warn('Error accessing cache, continuing with search:', error);
    }

    // Parse numeric parameters
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;

    // Initialize result variables
    let results = [];
    let total = 0;
    let totalPages = 0;
    let aiSummary = '';

    // Search for content based on type
    if (type === 'educational' || type === 'placement') {
      // Get local resources from database
      const dbResults = await performDatabaseSearch(q as string, type as string, pageNum, limitNum);
      
      // Get external resources from Serper
      const externalResults = await performExternalSearch(q as string, type as string, contentType as string, recency as string, pageNum, limitNum);
      
      // Combine and sort results
      results = [...dbResults.results, ...externalResults.results]
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, limitNum);
      
      total = dbResults.total + externalResults.total;
      totalPages = Math.ceil(total / limitNum);
      
      // Generate AI summary for first page only
      if (pageNum === 1) {
        aiSummary = await generateAISummary(q as string, type as string);
      }
    } 
    else if (type === 'videos') {
      // Search specifically for videos
      const videoResults = await performVideoSearch(q as string, recency as string, pageNum, limitNum);
      results = videoResults.results;
      total = videoResults.total;
      totalPages = videoResults.totalPages;
      
      // Generate AI summary for first page only
      if (pageNum === 1) {
        aiSummary = await generateAISummary(q as string, 'video');
      }
    }
    else if (type === 'documents') {
      // Search specifically for documents
      const documentResults = await performDocumentSearch(q as string, recency as string, pageNum, limitNum);
      results = documentResults.results;
      total = documentResults.total;
      totalPages = documentResults.totalPages;
      
      // Generate AI summary for first page only
      if (pageNum === 1) {
        aiSummary = await generateAISummary(q as string, 'document');
      }
    }

    // Prepare response
    const response = {
      results,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      aiSummary
    };

    // Cache results (5 minutes for first page, 10 minutes for subsequent pages)
    const cacheTime = pageNum === 1 ? 300 : 600;
    try {
      await setCache(cacheKey, response, cacheTime);
      await localMemoryCache.set(cacheKey, response, cacheTime);
    } catch (error) {
      console.warn('Error caching search results:', error);
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error('Enhanced search error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

// Helper function for database search
async function performDatabaseSearch(query: string, type: string, page: number, limit: number) {
  try {
    // Build filters for Elasticsearch
    const filters: Record<string, any> = {};
    if (type === 'placement') {
      filters.category = 'placement';
    }

    // Execute search
    const results = await searchResources({
      query,
      filters,
      page,
      limit,
      sort: { createdAt: 'desc' }
    });

    // Transform results to the standard format
    const transformedResults = results.results.map(result => ({
      id: result.id,
      title: result.title,
      description: result.description,
      type: result.type,
      subject: result.subject,
      semester: result.semester,
      url: result.fileUrl || result.link,
      publishDate: result.createdAt,
      author: result.uploadedBy,
      score: result.score || 1,
      source: 'Institution Library'
    }));

    return {
      results: transformedResults,
      total: results.total,
      totalPages: Math.ceil(results.total / limit)
    };
  } catch (error) {
    console.error('Database search error:', error);
    return { results: [], total: 0, totalPages: 0 };
  }
}

// Helper function for external search using Serper
async function performExternalSearch(query: string, type: string, contentType: string, recency: string, page: number, limit: number) {
  try {
    // Enhance query based on type
    let enhancedQuery = query;
    if (type === 'educational') {
      enhancedQuery = `${query} educational resources study materials`;
    } else if (type === 'placement') {
      enhancedQuery = `${query} placement preparation interview questions`;
    }

    // Add content type filters
    if (contentType !== 'all') {
      enhancedQuery += ` ${contentType}`;
    }

    // Add recency filter to the query if needed
    let searchQuery = enhancedQuery;
    if (recency !== 'any') {
      searchQuery += ` last ${recency}`;
    }

    // Get results from Serper
    const searchResult = await serperService.search({
      q: searchQuery,
      gl: 'us',
      hl: 'en',
      num: limit,
      page
    });

    // Transform organic results to our standard format
    const transformedResults = (searchResult.organic || []).map((result: any, index: number) => ({
      id: `serper-${Date.now()}-${index}`,
      title: result.title,
      description: result.snippet,
      type: result.link.includes('youtube.com') || result.link.includes('vimeo.com') 
        ? 'video' 
        : (result.link.includes('.pdf') ? 'pdf' : 'link'),
      url: result.link,
      thumbnailUrl: result.imageUrl || result.thumbnail,
      source: result.source || 'Web Search',
      publishDate: result.date,
      score: 1 - (index * 0.05) // Simple scoring based on position
    }));

    return {
      results: transformedResults,
      total: Math.min(100, transformedResults.length * 5), // Estimate total results
      totalPages: Math.ceil(Math.min(100, transformedResults.length * 5) / limit)
    };
  } catch (error) {
    console.error('External search error:', error);
    return { results: [], total: 0, totalPages: 0 };
  }
}

// Helper function for video search
async function performVideoSearch(query: string, recency: string, page: number, limit: number) {
  try {
    // Enhance query with educational focus
    const enhancedQuery = `${query} educational lecture tutorial`;
    
    // Add recency to the query if needed
    let searchQuery = enhancedQuery;
    if (recency !== 'any') {
      searchQuery += ` last ${recency}`;
    }
    
    // Get video results from Serper
    const searchResult = await serperService.search({
      q: searchQuery,
      gl: 'us',
      hl: 'en',
      num: limit,
      page,
      type: 'search' // Changed from 'videos' to 'search' since 'videos' is not a valid type
    });
    
    // Transform video results
    const transformedResults = (searchResult.videos || []).map((video: any, index: number) => ({
      id: `video-${Date.now()}-${index}`,
      title: video.title,
      description: video.snippet,
      type: 'video',
      url: video.link,
      thumbnailUrl: video.thumbnail,
      source: video.source || 'Video Search',
      publishDate: video.date,
      author: video.channel,
      score: 1 - (index * 0.05) // Simple scoring based on position
    }));
    
    return {
      results: transformedResults,
      total: Math.min(100, transformedResults.length * 5), // Estimate total
      totalPages: Math.ceil(Math.min(100, transformedResults.length * 5) / limit)
    };
  } catch (error) {
    console.error('Video search error:', error);
    return { results: [], total: 0, totalPages: 0 };
  }
}

// Helper function for document search
async function performDocumentSearch(query: string, recency: string, page: number, limit: number) {
  try {
    // Enhance query with document focus
    const enhancedQuery = `${query} filetype:pdf OR filetype:doc OR filetype:ppt educational`;
    
    // Add recency to the query if needed
    let searchQuery = enhancedQuery;
    if (recency !== 'any') {
      searchQuery += ` last ${recency}`;
    }
    
    // Get document results from Serper
    const searchResult = await serperService.search({
      q: searchQuery,
      gl: 'us',
      hl: 'en',
      num: limit,
      page
    });
    
    // Transform document results
    const transformedResults = (searchResult.organic || []).map((doc: any, index: number) => {
      // Determine document type
      let docType = 'document';
      if (doc.link.includes('.pdf')) docType = 'pdf';
      else if (doc.link.includes('.doc') || doc.link.includes('.docx')) docType = 'doc';
      else if (doc.link.includes('.ppt') || doc.link.includes('.pptx')) docType = 'ppt';
      
      return {
        id: `doc-${Date.now()}-${index}`,
        title: doc.title,
        description: doc.snippet,
        type: docType,
        url: doc.link,
        source: doc.source || 'Document Search',
        publishDate: doc.date,
        score: 1 - (index * 0.05) // Simple scoring based on position
      };
    });
    
    return {
      results: transformedResults,
      total: Math.min(100, transformedResults.length * 5), // Estimate total
      totalPages: Math.ceil(Math.min(100, transformedResults.length * 5) / limit)
    };
  } catch (error) {
    console.error('Document search error:', error);
    return { results: [], total: 0, totalPages: 0 };
  }
}

// Helper function to generate AI summary
async function generateAISummary(query: string, type: string): Promise<string> {
  try {
    // Construct prompt based on search type
    let prompt = '';
    if (type === 'educational' || type === 'study') {
      prompt = `Provide a concise, helpful summary about "${query}" that would be useful for a student. Focus on key educational concepts, learning resources, and proper understanding.`;
    } else if (type === 'placement') {
      prompt = `Provide a brief, informative summary about "${query}" from a job placement and interview preparation perspective. Focus on key skills, interview topics, and career advice.`;
    } else if (type === 'video') {
      prompt = `Provide a brief summary about "${query}" that explains what a student might learn from educational videos on this topic. Mention key educational concepts.`;
    } else if (type === 'document') {
      prompt = `Provide a brief summary about "${query}" that explains what key documents, papers, or educational materials exist on this topic and what a student might learn from them.`;
    }
    
    // Generate text
    const response = await generateText(prompt);
    
    if (response.success && response.text) {
      // Extract just the summary part (first 2-3 sentences)
      const text = response.text;
      const sentences = text.split(/\.\s+/).filter(Boolean).map((s: string) => s.trim() + '.');
      return sentences.slice(0, 3).join(' ');
    }
    
    return '';
  } catch (error) {
    console.error('Error generating AI summary:', error);
    return '';
  }
}
