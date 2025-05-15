import express from 'express';
import { runCorsMiddleware } from '../../pages/api/_middleware.js';
import connectDB from '../../lib/db/connect.js';
import mongoose from 'mongoose';
import { verifyToken } from '../../lib/auth/jwt.js';

const router = express.Router();

// Create resource model reference
const Resource = mongoose.models.Resource || mongoose.model('Resource', new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  type: { type: String, required: true },
  subject: { type: String, required: true },
  semester: { type: Number, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fileUrl: { type: String },
  fileName: { type: String },
  category: { type: String },
  placementCategory: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  stats: {
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    downloads: { type: Number, default: 0 },
    lastViewed: { type: Date }
  }
}));

// Get faculty resources
router.get('/faculty', async (req:any, res:any) => {
  try {
    await runCorsMiddleware(req, res);
    await connectDB();
    
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

    // Ensure user is faculty or admin - debugging info
    console.log('User data from token:', userData);
    
    // Check if user data exists
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
      return res.status(403).json({ error: 'Access denied. Only faculty can view faculty resources.' });
    }

    // Find all resources uploaded by this faculty member
    const resources = await Resource.find({
      uploadedBy: userData.userId,
    })
    .sort({ createdAt: -1 })
    .populate('uploadedBy', 'fullName')
    .limit(50);

    console.log(`Found ${resources.length} resources for user ${userData.userId}`);
    return res.status(200).json({ resources });
  } catch (error) {
    console.error('Error fetching faculty resources:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Get all resources
router.get('/', async (req:any, res:any) => {
  try {
    await runCorsMiddleware(req, res);
    await connectDB();

    const resources = await Resource.find()
      .sort({ createdAt: -1 })
      .populate('uploadedBy', 'fullName')
      .limit(50);

    return res.status(200).json({ resources });
  } catch (error) {
    console.error('Error fetching resources:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get placement resources
router.get('/placement', async (req:any, res:any) => {
  try {
    await runCorsMiddleware(req, res);
    await connectDB();

    const resources = await Resource.find({ category: 'placement' })
      .sort({ createdAt: -1 })
      .populate('uploadedBy', 'fullName')
      .limit(50);

    return res.status(200).json({ resources });
  } catch (error) {
    console.error('Error fetching placement resources:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Create resource
router.post('/', async (req:any, res:any) => {
  try {
    await runCorsMiddleware(req, res);
    await connectDB();

    // Get authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Verify token
    const token = authHeader.split(' ')[1];
    let userData:any;
    try {
      userData = verifyToken(token);
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { title, description, type, subject, semester, link, category, placementCategory } = req.body;

    const resource = new Resource({
      title,
      description,
      type,
      subject,
      semester,
      uploadedBy: userData.userId,
      fileUrl: link,
      category,
      placementCategory
    });

    await resource.save();

    return res.status(201).json({ 
      message: 'Resource created successfully',
      resource
    });
  } catch (error) {
    console.error('Error creating resource:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;