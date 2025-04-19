
import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../lib/db/connect';
import { Resource } from '../../../lib/db/models/Resource';
import { verifyToken } from '../../../lib/auth/jwt';
import { runCorsMiddleware } from '../_middleware';
import { getErrorMessage } from '../../../utils/errorUtils';
import { IncomingForm } from 'formidable';
import * as fs from 'fs';
import * as path from 'path';

// Configure formidable to handle file uploads
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
    
    switch (req.method) {
      case 'GET':
        return getResources(req, res);
      case 'POST':
        return createResource(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Resource API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getResources(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { semester, subject, type, category, placementCategory } = req.query;
    
    const query: any = {};
    
    if (semester) query.semester = parseInt(semester as string);
    if (subject) query.subject = subject;
    if (type) query.type = type;
    if (category) query.category = category;
    if (placementCategory) query.placementCategory = placementCategory;
    
    console.log('Fetching resources with query:', query);
    
    const resources = await Resource.find(query)
      .sort({ createdAt: -1 })
      .populate('uploadedBy', 'fullName')
      .limit(50);
    
    return res.status(200).json({ resources });
  } catch (error) {
    console.error('Error fetching resources:', error);
    return res.status(500).json({ error: getErrorMessage(error) });
  }
}

async function createResource(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('Creating resource...');
    
    // Configure formidable with higher file size limit (50MB)
    const form = new IncomingForm({
      keepExtensions: true,
      multiples: false,
      maxFileSize: 50 * 1024 * 1024, // 50MB in bytes
    });

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log(`Created uploads directory: ${uploadDir}`);
    }
    
    // Parse form data
    const [fields, files] = await new Promise<[any, any]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('Form parsing error:', err);
          return reject(err);
        }
        resolve([fields, files]);
      });
    });
    
    console.log('Parsed form fields:', fields);
    console.log('Parsed files:', files && Object.keys(files).length ? 'Files present' : 'No files');

    // Extract fields from the form data
    const title = fields.title?.[0] || fields.title;
    const description = fields.description?.[0] || fields.description || '';
    const type = fields.type?.[0] || fields.type;
    const subject = fields.subject?.[0] || fields.subject;
    const semester = fields.semester?.[0] || fields.semester;
    const link = fields.link?.[0] || fields.link || '';
    const category = fields.category?.[0] || fields.category || 'study';
    const placementCategory = fields.placementCategory?.[0] || fields.placementCategory || null;
    
    // Validate required fields
    if (!title || !type || !subject || semester === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (type === 'link' && !link) {
      return res.status(400).json({ error: 'Link is required for link type resources' });
    }
    
    // Attempt to get user ID from auth token, but don't require it
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const userData = verifyToken(token);
        if (userData) {
          userId = userData.userId;
        }
      } catch (error) {
        console.log('Auth token verification failed, continuing without user ID');
      }
    }

    // Prepare file data if available
    let fileUrl = null;
    let fileSize = 0;
    let fileName = '';
    
    if (files && files.file) {
      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      
      if (file) {
        // For a real implementation, you would upload to S3 or another storage service
        // For now, we'll move the file to the public uploads directory
        fileName = file.originalFilename || `file-${Date.now()}${path.extname(file.filepath)}`;
        const newFilePath = path.join(uploadDir, fileName);
        
        // Copy file to uploads directory
        await fs.promises.copyFile(file.filepath, newFilePath);
        
        // Clean up the temporary file
        await fs.promises.unlink(file.filepath);
        
        fileUrl = `/uploads/${fileName}`;
        fileSize = file.size;
        
        console.log('File saved:', {
          name: fileName,
          size: fileSize,
          path: newFilePath
        });
      }
    }
    
    // Create the resource document
    const resourceData: any = {
      title,
      description,
      type,
      subject,
      semester: parseInt(semester as string),
      fileUrl,
      fileSize,
      fileName,
      link,
      stats: {
        views: 0,
        likes: 0,
        comments: 0,
        downloads: 0,
      },
      category,
    };
    
    // Only add placementCategory if it's a placement resource
    if (category === 'placement' && placementCategory) {
      resourceData.placementCategory = placementCategory;
    }
    
    // Only add uploadedBy if we have a userId
    if (userId) {
      resourceData.uploadedBy = userId;
    }
    
    console.log('Creating resource with data:', resourceData);
    
    const resource = new Resource(resourceData);
    
    await resource.save();
    console.log('Resource saved to database:', resource._id);
    
    return res.status(201).json({ 
      resource,
      message: 'Resource created successfully'
    });
  } catch (error) {
    console.error('Error creating resource:', error);
    return res.status(500).json({ error: getErrorMessage(error) });
  }
}
