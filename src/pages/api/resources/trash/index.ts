
import { NextApiRequest, NextApiResponse } from 'next';
import { Resource } from '../../../../lib/db/models/Resource.ts';
import { verifyToken } from '../../../../lib/auth/jwt.ts';
import { runCorsMiddleware } from '../../_middleware.ts';
import { format } from 'date-fns';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await runCorsMiddleware(req, res);

    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    // Get all resources that have been soft deleted
    const trashedResources = await Resource.find({
      deletedAt: { $ne: null }
    }).sort({ deletedAt: -1 });

    // Format the response
    const items = trashedResources.map(resource => ({
      id: resource._id.toString(),
      name: resource.title,
      type: resource.type,
      size: resource.fileSize ? `${(resource.fileSize / 1024 / 1024).toFixed(2)} MB` : 'N/A',
      deletedAt: resource.deletedAt?.toISOString() || '',
      originalPath: resource.fileUrl || '',
      resourceId: resource._id.toString()
    }));

    return res.status(200).json({ success: true, items });
  } catch (error) {
    console.error('Error retrieving trashed resources:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
