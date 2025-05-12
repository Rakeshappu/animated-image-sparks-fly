
import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../lib/db/connect';
import { Resource } from '../../../lib/db/models/Resource';
import { verifyToken } from '../../../lib/auth/jwt';
import { runCorsMiddleware } from '../_middleware';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { getErrorMessage } from '../../../utils/errorUtils';
import { getStandardizedCategory, getAllCategoryIds } from '../../../utils/placementCategoryUtils';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Apply CORS middleware
    await runCorsMiddleware(req, res);
    
    // Connect to the database
    await connectDB();
    
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Verify token
    const token = authHeader.split(' ')[1];
    let userData;
    try {
      userData = verifyToken(token);
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Ensure user is faculty or admin
    if (!userData || !userData.userId) {
      return res.status(403).json({ error: 'Access denied. Invalid user data.' });
    }

    // Get user from database to check role
    const User = mongoose.models.User;
    const user = await User.findById(userData.userId);
    
    if (!user) {
      return res.status(403).json({ error: 'User not found.' });
    }
    
    // Check if user has the right role
    if (user.role !== 'faculty' && user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Only faculty can upload placement resources.' });
    }

    // Parse form data using formidable
    const form = formidable({
      maxFileSize: 100 * 1024 * 1024, // 100MB max file size
    });
    
    // Parse the form
    const [fields, files] = await form.parse(req);
    console.log('Parsed form fields:', fields);
    console.log('Parsed files:', Object.keys(files).length ? 'Files present' : 'No files');

    // Validate the placement category
    let placementCategory = fields.placementCategory?.[0] || 'general';
    
    // Check if the category is valid
    const validCategories = getAllCategoryIds();
    if (!validCategories.includes(placementCategory)) {
      placementCategory = 'general';
    }
    
    // Standardize the category
    placementCategory = getStandardizedCategory(placementCategory);
    
    console.log('Using placement category:', placementCategory);

    let resourceData: any = {
      title: fields.title?.[0] || '',
      description: fields.description?.[0] || '',
      type: fields.type?.[0] || 'document',
      subject: fields.subject?.[0] || '',
      semester: fields.semester?.[0] ? parseInt(fields.semester[0]) : 0,
      category: 'placement',
      placementCategory: placementCategory,
      uploadedBy: new mongoose.Types.ObjectId(userData.userId),
    };

    console.log('Preparing resource data:', resourceData);

    // If this is a link type resource, add the link
    if (resourceData.type === 'link' && fields.link) {
      resourceData.link = fields.link[0];
    }

    // If we have a file, handle file upload
    const uploadedFile = files.file?.[0];
    if (uploadedFile && uploadedFile.filepath) {
      // Generate file name and path
      const fileName = `${Date.now()}-${uploadedFile.originalFilename}`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      
      // Ensure upload directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const newPath = path.join(uploadDir, fileName);
      
      // Copy file to uploads directory
      fs.copyFileSync(uploadedFile.filepath, newPath);
      
      // Add file info to resource data
      resourceData.fileName = uploadedFile.originalFilename;
      resourceData.fileUrl = `/uploads/${fileName}`;
      resourceData.fileSize = uploadedFile.size;
      
      console.log('File uploaded:', {
        originalName: uploadedFile.originalFilename,
        size: uploadedFile.size,
        path: newPath,
        publicUrl: resourceData.fileUrl
      });
    } else if (resourceData.type !== 'link') {
      return res.status(400).json({ error: 'File is required for document, video, or note resources' });
    }

    // Initialize stats object
    resourceData.stats = {
      views: 0,
      downloads: 0,
      likes: 0,
      comments: 0,
      lastViewed: new Date(),
      dailyViews: []
    };

    // Initialize empty arrays for comments and likedBy
    resourceData.comments = [];
    resourceData.likedBy = [];

    try {
      // Create resource in database
      const resource = new Resource(resourceData);
      await resource.save();
      console.log('Resource saved to database:', resource._id);

      return res.status(201).json({ 
        success: true, 
        resource 
      });
    } catch (error) {
      console.error('Error saving resource to database:', error);
      return res.status(500).json({ 
        error: 'Database error',
        details: getErrorMessage(error)
      });
    }
  } catch (error) {
    console.error('Error uploading placement resource:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}
