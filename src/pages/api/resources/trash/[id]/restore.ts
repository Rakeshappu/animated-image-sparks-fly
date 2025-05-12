
import { NextApiRequest, NextApiResponse } from 'next';
import { Resource } from '../../../../../lib/db/models/Resource.ts';
import { verifyToken } from '../../../../../lib/auth/jwt.ts';
import { runCorsMiddleware } from '../../../_middleware.ts';

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

    // Restore the resource
    resource.deletedAt = null;
    await resource.save();

    return res.status(200).json({ success: true, message: 'Resource restored successfully' });
  } catch (error) {
    console.error('Error restoring resource:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
