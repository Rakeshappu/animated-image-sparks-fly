
import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../../lib/db/connect.ts';
import { Resource } from '../../../../lib/db/models/Resource.ts';
import { verifyToken } from '../../../../lib/auth/jwt.ts';
import { runCorsMiddleware } from '../../_middleware.ts';
import { getErrorMessage } from '../../../../utils/errorUtils.ts';
import * as fs from 'fs';
import * as path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Apply CORS middleware
    await runCorsMiddleware(req, res);
    
    // Connect to the database
    await connectDB();

    const { id } = req.query;
    
    if (!id || Array.isArray(id)) {
      return res.status(400).json({ error: 'Invalid resource ID' });
    }
    
    switch (req.method) {
      case 'GET':
        return getResourceById(id, res);
      case 'DELETE':
        return deleteResource(id, req, res);
      case 'PUT':
        return updateResource(id, req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Resource API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getResourceById(id: string, res: NextApiResponse) {
  try {
    const resource = await Resource.findById(id)
      .populate('uploadedBy', 'fullName')
      .lean();
    
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    
    // Update view count
    await Resource.findByIdAndUpdate(id, { $inc: { 'stats.views': 1 } });
    
    return res.status(200).json({ resource });
  } catch (error) {
    console.error('Error fetching resource:', error);
    return res.status(500).json({ error: getErrorMessage(error) });
  }
}

async function deleteResource(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log(`Deleting resource with ID: ${id}`);
    
    // Validate authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    try {
      const token = authHeader.split(' ')[1];
      verifyToken(token);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }
    
    // Find the resource
    const resource = await Resource.findById(id);
    
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    
    // If resource has a file, delete it from the filesystem
    if (resource.fileUrl && resource.fileUrl.startsWith('/uploads/')) {
      try {
        const filePath = path.join(process.cwd(), 'public', resource.fileUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Deleted file: ${filePath}`);
        }
      } catch (fileError) {
        console.error('Error deleting file:', fileError);
        // Continue with resource deletion even if file deletion fails
      }
    }
    
    // Delete the resource from the database
    await Resource.findByIdAndDelete(id);
    console.log(`Resource deleted successfully: ${id}`);
    
    return res.status(200).json({ success: true, message: 'Resource deleted successfully' });
  } catch (error) {
    console.error('Error deleting resource:', error);
    return res.status(500).json({ error: getErrorMessage(error) });
  }
}

async function updateResource(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    // Basic implementation for updating resource
    const { title, description, subject, semester } = req.body;
    
    const updatedResource = await Resource.findByIdAndUpdate(
      id,
      { 
        title, 
        description, 
        subject, 
        semester,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!updatedResource) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    
    return res.status(200).json({ 
      success: true, 
      message: 'Resource updated successfully',
      resource: updatedResource
    });
  } catch (error) {
    console.error('Error updating resource:', error);
    return res.status(500).json({ error: getErrorMessage(error) });
  }
}
