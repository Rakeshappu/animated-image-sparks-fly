
import { NextApiRequest, NextApiResponse } from 'next';
import { Resource } from '../../../../lib/db/models/Resource';
import { verifyToken } from '../../../../lib/auth/jwt';
import { runCorsMiddleware } from '../../_middleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await runCorsMiddleware(req, res);
    
    const { id } = req.query;
    if (!id || Array.isArray(id)) {
      return res.status(400).json({ error: 'Invalid resource ID' });
    }

    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    // Find the resource
    const resource = await Resource.findById(id);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    // Increment view count
    if (!resource.stats) {
      resource.stats = {
        views: 1,
        downloads: 0,
        likes: 0,
        comments: 0,
        lastViewed: new Date(),
        dailyViews: [{
          date: new Date(),
          count: 1
        }],
      };
    } else {
      resource.stats.views = (resource.stats.views || 0) + 1;
      resource.stats.lastViewed = new Date();
      
      // Update daily views
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const existingDailyView = resource.stats.dailyViews?.find(dv => {
        if (!dv.date) return false;
        const dvDate = new Date(dv.date);
        dvDate.setHours(0, 0, 0, 0);
        return dvDate.getTime() === today.getTime();
      });
      
      if (existingDailyView) {
        existingDailyView.count = (existingDailyView.count || 0) + 1;
      } else {
        if (!resource.stats.dailyViews) {
          resource.stats.dailyViews = [];
        }
        resource.stats.dailyViews.push({
          date: today,
          count: 1
        });
      }
    }
    
    await resource.save();

    return res.status(200).json({ success: true, views: resource.stats.views });
  } catch (error) {
    console.error('Error updating view count:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
