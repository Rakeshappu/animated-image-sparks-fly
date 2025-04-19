
import { NextApiRequest, NextApiResponse } from 'next';
import { Resource } from '../../../../../lib/db/models/Resource';
import { verifyToken } from '../../../../../lib/auth/jwt';
import { runCorsMiddleware } from '../../../_middleware';
import mongoose from 'mongoose';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
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

    // Find the resource in trash (only get items that are deleted)
    const resource = await Resource.findOne({
      _id: new mongoose.Types.ObjectId(id),
      deletedAt: { $ne: null }
    });

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found in trash' });
    }

    // Permanently delete the resource
    await Resource.deleteOne({ _id: new mongoose.Types.ObjectId(id) });

    return res.status(200).json({ success: true, message: 'Resource permanently deleted' });
  } catch (error) {
    console.error('Error deleting resource permanently:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
