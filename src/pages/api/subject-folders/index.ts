
import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../lib/db/connect.ts';
import mongoose from 'mongoose';
import { verifyToken } from '../../../lib/auth/jwt.ts';
import { runCorsMiddleware } from '../_middleware.ts';
import { getErrorMessage } from '../../../utils/errorUtils.ts';

// Create subject folder schema
const SubjectFolderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  subjectName: {
    type: String, // Added for compatibility
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8,
  },
  lecturerName: {
    type: String,
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Changed to false for compatibility during testing
  },
  resourceCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Get or create the model
let SubjectFolder: mongoose.Model<any>;
try {
  SubjectFolder = mongoose.model('SubjectFolder');
} catch (error) {
  SubjectFolder = mongoose.model('SubjectFolder', SubjectFolderSchema);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Apply CORS middleware
    await runCorsMiddleware(req, res);
    
    // Connect to the database
    await connectDB();
    
    // Check auth token for methods that require authentication
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const token = authHeader.split(' ')[1];
      try {
        const userData = verifyToken(token);
        if (!userData) {
          return res.status(401).json({ error: 'Invalid token' });
        }
        
        // Add user ID to the request for use in route handlers
        req.body.userId = userData.userId;
      } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ error: 'Invalid token' });
      }
    }
    
    switch (req.method) {
      case 'GET':
        return getSubjectFolders(req, res);
      case 'POST':
        return createSubjectFolders(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Subject Folders API error:', error);
    return res.status(500).json({ error: getErrorMessage(error) });
  }
}

async function getSubjectFolders(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { semester } = req.query;
    
    const query: any = {};
    
    if (semester) query.semester = parseInt(semester as string);
    
    const folders = await SubjectFolder.find(query).sort({ semester: 1, name: 1 });
    
    return res.status(200).json({ folders });
  } catch (error) {
    console.error('Error fetching subject folders:', error);
    return res.status(500).json({ error: getErrorMessage(error) });
  }
}

async function createSubjectFolders(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { subjects, userId } = req.body;
    
    console.log('Received subjects data:', subjects);
    
    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ error: 'Missing subject folders data' });
    }
    
    // Validate each subject has the required fields
    for (const subject of subjects) {
      if (!subject.subjectName || !subject.lecturerName || !subject.semester) {
        return res.status(400).json({ 
          error: 'Each subject must have subjectName, lecturerName and semester' 
        });
      }
    }
    
    try {
      const folderPromises = subjects.map(subject => {
        return new SubjectFolder({
          name: subject.subjectName || subject.name,
          subjectName: subject.subjectName || subject.name,
          semester: subject.semester,
          lecturerName: subject.lecturerName,
          createdBy: userId || '000000000000000000000000', // Default ID for testing
        }).save();
      });
      
      const folders = await Promise.all(folderPromises);
      
      return res.status(201).json({ 
        message: `Created ${folders.length} subject folders`,
        folders 
      });
    } catch (error) {
      console.error('Error creating subject folders:', error);
      return res.status(500).json({ error: getErrorMessage(error) });
    }
  } catch (error) {
    console.error('Error in createSubjectFolders:', error);
    return res.status(500).json({ error: getErrorMessage(error) });
  }
}
