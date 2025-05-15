import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './lib/db/connect.js';
import authRoutes from './server/routes/auth.routes.js';
import { errorHandler } from './server/middleware/error.middleware.js';
import { initializeSocketIO } from './lib/realtime/socket.js';

// For ES modules support
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'https://versatileshare-b57k.onrender.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/auth', authRoutes);

// Import routes using dynamic imports
const setupRoutes = async () => {
  try {
    // Subject folders route
    const subjectFoldersModule = await import('./server/routes/subject-folders.routes.js');
    app.use('/api/subject-folders', subjectFoldersModule.default);
    
    // Resources routes
    const resourcesModule = await import('./server/routes/resources.routes.js');
    app.use('/api/resources', resourcesModule.default);
    
    // User routes
    const userModule = await import('./server/routes/user.routes.js');
    app.use('/api/user', userModule.default);
    
    console.log('All API routes registered successfully');
  } catch (error) {
    console.error('Error setting up routes:', error);
  }
};

// Set up routes
setupRoutes();

// Database status endpoint
app.get('/api/db/status', async (req, res) => {
  try {
    const isConnected = mongoose.connection && mongoose.connection.readyState === 1;
    
    res.json({
      connected: isConnected,
      message: isConnected ? 'Connected to MongoDB' : 'Not connected to MongoDB',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('DB status check error:', error);
    res.status(500).json({
      connected: false,
      error: String(error),
      message: 'Failed to check MongoDB connection'
    });
  }
});

// Simple API route for testing
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// Add auth/me endpoint which is missing
app.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-for-development';
    
    try {
      // Use imported verifyToken function
      const verifyTokenModule = await import('./lib/auth/jwt.js');
      const decoded:any = verifyTokenModule.verifyToken(token);
      
      // Find user
      const { User } = await import('./lib/db/models/User.js');
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      return res.status(200).json({
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          department: user.department,
          phoneNumber: user.phoneNumber,
          avatar: user.avatar || undefined,
          semester: user.semester || undefined,
          isVerified: !!user.isEmailVerified,
        },
        timestamp: new Date().toISOString()
      });
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Handle API 404
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `API endpoint not found: ${req.originalUrl}` });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  // Serve React app for all non-API routes
  app.get('*', (req, res) => {
    // Only serve the index.html for non-API routes
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.resolve(__dirname, '../dist', 'index.html'));
    }
  });
}

// Error handling middleware
app.use(errorHandler);

// Required for the DB status endpoint
import mongoose from 'mongoose';

// Connect to database and start server
const startServer = async () => {
  try {
    console.log(`Attempting MongoDB connection to: ${process.env.MONGODB_URI?.replace(/\/\/(.+?)@/, '//****@')}`);
    await connectDB();
    console.log('Connected to MongoDB');
    
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
    
    // Set up Socket.io
    initializeSocketIO(server);
    
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err instanceof Error ? err.message : String(err));
    // Continue starting the server even if DB connection fails
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} (without MongoDB connection)`);
    });
  }
};

startServer();

// For testing/development
export default app;