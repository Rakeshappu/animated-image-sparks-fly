
import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../lib/db/connect';
import { Resource } from '../../../lib/db/models/Resource';
import { Activity } from '../../../lib/db/models/Activity';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { semester, department, limit = '8', timeframe = '7' } = req.query;

    // Calculate trending resources based on recent activity
    const timeframeMs = parseInt(timeframe as string) * 24 * 60 * 60 * 1000;
    const cutoffDate = new Date(Date.now() - timeframeMs);

    // Build activity aggregation pipeline
    const activityPipeline: any[] = [
      {
        $match: {
          timestamp: { $gte: cutoffDate },
          type: { $in: ['view', 'download', 'like'] }
        }
      },
      {
        $group: {
          _id: '$resource',
          views: {
            $sum: { $cond: [{ $eq: ['$type', 'view'] }, 1, 0] }
          },
          downloads: {
            $sum: { $cond: [{ $eq: ['$type', 'download'] }, 1, 0] }
          },
          likes: {
            $sum: { $cond: [{ $eq: ['$type', 'like'] }, 1, 0] }
          },
          uniqueUsers: { $addToSet: '$user' },
          lastActivity: { $max: '$timestamp' }
        }
      },
      {
        $addFields: {
          trendingScore: {
            $add: [
              { $multiply: ['$views', 1] },
              { $multiply: ['$downloads', 3] },
              { $multiply: ['$likes', 2] },
              { $multiply: [{ $size: '$uniqueUsers' }, 1.5] }
            ]
          }
        }
      },
      {
        $match: {
          trendingScore: { $gte: 2 } // Minimum activity threshold
        }
      },
      {
        $sort: { trendingScore: -1 }
      },
      {
        $limit: parseInt(limit as string) * 2 // Get more to filter later
      }
    ];

    const trendingActivities = await Activity.aggregate(activityPipeline);

    if (trendingActivities.length === 0) {
      return res.status(200).json({ resources: [], trending: true });
    }

    // Get resource details
    const resourceIds = trendingActivities.map(activity => activity._id).filter(id => id);
    
    // Build resource filter
    const resourceFilter: any = { _id: { $in: resourceIds } };
    
    if (semester) {
      resourceFilter.semester = parseInt(semester as string);
    }
    
    if (department) {
      resourceFilter.department = department;
    }

    const resources = await Resource.find(resourceFilter)
      .populate('uploadedBy', 'fullName')
      .lean();

    // Combine resource data with trending metrics
    const trendingResources = resources.map(resource => {
      const activity = trendingActivities.find(a => 
        a._id && a._id.toString() === resource._id.toString()
      );
      
      return {
        ...resource,
        trending: {
          score: activity?.trendingScore || 0,
          views: activity?.views || 0,
          downloads: activity?.downloads || 0,
          likes: activity?.likes || 0,
          uniqueUsers: activity?.uniqueUsers?.length || 0,
          lastActivity: activity?.lastActivity
        }
      };
    });

    // Sort by trending score
    trendingResources.sort((a, b) => (b.trending.score || 0) - (a.trending.score || 0));

    return res.status(200).json({
      resources: trendingResources.slice(0, parseInt(limit as string)),
      trending: true,
      timeframe: `${timeframe} days`,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error fetching trending resources:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
