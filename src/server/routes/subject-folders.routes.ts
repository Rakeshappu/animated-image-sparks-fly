import express, { Request, Response } from 'express';

import connectDB from '../../lib/db/connect.js';
import mongoose from 'mongoose';
import { verifyToken } from '../../lib/auth/jwt.js';

const router = express.Router();

// Create subject folder schema if it doesn't exist
const subjectFolderSchema = new mongoose.Schema({
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
interface ISubjectFolder {
  name: string;
  subjectName?: string;
  semester: number;
  lecturerName: string;
  createdBy?: mongoose.Types.ObjectId;
  resourceCount?: number;
  createdAt?: Date;
}
const SubjectFolder = mongoose.models.SubjectFolder as mongoose.Model<ISubjectFolder> 
  || mongoose.model<ISubjectFolder>('SubjectFolder', subjectFolderSchema);

// Get all subject folders
router.get('/', async (req: Request<{}, {}, {}, { semester?: string }>, res: Response) => {
  try {
    await connectDB();

    const { semester } = req.query;

    const query: any = {};

    if (semester) query.semester = parseInt(semester);

    const folders = await SubjectFolder.find(query).sort({ semester: 1, name: 1 });

    return res.status(200).json({ folders });
  } catch (error: any) {
    console.error('Error fetching subject folders:', error);
    return res.status(500).json({ error: error.message });
  }
});
// Create subject folders
router.post('/', async (req, res) => {
  try {
    await connectDB();
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const token = authHeader.split(' ')[1];
    let userData;
    
    try {
      userData = verifyToken(token);
      if (!userData) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      
      req.body.userId = userData.userId;
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ error: 'Invalid token' });
    }
    
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
  } catch (error:any) {
    console.error('Error in createSubjectFolders:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;