
import { NextApiRequest, NextApiResponse } from 'next';
import { Resource } from '../../../../lib/db/models/Resource';
import { Activity } from '../../../../lib/db/models/Activity';
import { verifyToken } from '../../../../lib/auth/jwt';
import { runCorsMiddleware } from '../../_middleware';
import mongoose from 'mongoose';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers for all responses including errors
  await runCorsMiddleware(req, res);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    if (!id || Array.isArray(id)) {
      return res.status(400).json({ error: 'Invalid resource ID' });
    }

    // Get authentication info, but make it optional - allow anonymous views
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        // Check if decoded exists and has userId before accessing it
        if (decoded && decoded.userId) {
          userId = decoded.userId;
        }
      } catch (authError) {
        console.error('Auth token error:', authError);
        // Continue with anonymous view
      }
    }

    // Find the resource
    const resource = await Resource.findById(id);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    // Get current date with time set to midnight for accurate daily tracking
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Initialize stats object if it doesn't exist
    if (!resource.stats) {
      resource.stats = {
        views: 1,
        downloads: 0,
        likes: 0,
        comments: 0,
        lastViewed: new Date(),
        dailyViews: [{
          date: today,
          count: 1
        }],
        studentFeedback: []
      };
    } else {
      // Update existing stats
      resource.stats.views = (resource.stats.views || 0) + 1;
      resource.stats.lastViewed = new Date();
      
      // Initialize daily views array if it doesn't exist
      if (!resource.stats.dailyViews) {
        resource.stats.dailyViews = [];
      }
      
      // Update daily views with today's date
      const existingDailyView = resource.stats.dailyViews?.find(dv => {
        if (!dv.date) return false;
        const dvDate = new Date(dv.date);
        dvDate.setHours(0, 0, 0, 0);
        return dvDate.getTime() === today.getTime();
      });
      
      if (existingDailyView) {
        existingDailyView.count = (existingDailyView.count || 0) + 1;
      } else {
        resource.stats.dailyViews.push({
          date: today,
          count: 1
        });
      }
    }
    
    // Save the resource with updated stats immediately
    await resource.save();
    console.log(`Updated view count for resource ${id} to ${resource.stats.views}`);

    // Determine the source of the view
    let source = 'other';
    
    // Check X-Source header first (set by our frontend)
    if (req.headers['x-source']) {
      source = req.headers['x-source'] as string;
    }
    // If not set, try to determine from referer
    else if (req.headers.referer) {
      if (req.headers.referer.includes('study-materials')) {
        source = 'study-materials';
      } else if (req.headers.referer.includes('bookmark')) {
        source = 'bookmarks';
      } else if (req.headers.referer.includes('placement')) {
        source = 'placement';
      }
    }

    console.log(`View source determined as: ${source}`);

    // Create activity record if user is logged in
    if (userId) {
      try {
        // Check resource type for appropriate message
        let message = 'Viewed resource';
        if (resource.category === 'placement') {
          message = `Viewed placement resource: ${resource.title}`;
        } else if (resource.category === 'study') {
          message = `Viewed study resource: ${resource.title}`;
        }

        console.log(`Creating activity record. Source: ${source}, Resource: ${resource.title}`);

        // Create new activity
        await Activity.create({
          user: new mongoose.Types.ObjectId(userId),
          type: 'view',
          resource: resource._id,
          timestamp: new Date(),
          message: message,
          source: source as 'study-materials' | 'bookmarks' | 'placement' | 'other'
        });
        
        console.log(`Activity record created for user ${userId}, resource ${id}`);
      } catch (activityError) {
        console.error('Failed to create activity record:', activityError);
        // Continue with view tracking even if activity creation fails
      }
    }

    // Return the updated count immediately
    return res.status(200).json({ 
      success: true, 
      views: resource.stats.views,
      resourceTitle: resource.title,
      resourceId: resource._id,
      category: resource.category,
      placementCategory: resource.placementCategory,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error updating view count:', error);
    return res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' });
  }
}
