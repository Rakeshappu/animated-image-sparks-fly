import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import connectDB from '../lib/db/connect.js';
import authRoutes from './routes/auth.routes.js';
import { errorHandler } from './middleware/error.middleware.js';
import { initializeSocketIO } from '../lib/realtime/socket.js';
import { initRedisClient } from '../lib/cache/redis.js';
import { initElasticsearchClient, createResourceIndex } from '../lib/search/elasticsearch.js';
import { redisConfig, elasticsearchConfig, localStorageConfig } from '../lib/config/services.js';

// For ES modules support
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8080', 'https://versatileshare-b57k.onrender.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Pre-flight requests
app.options('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8080', 'https://versatileshare-b57k.onrender.com'],
  credentials: true
}));

app.use(express.json());

// Ensure mock storage directory exists
if (process.env.NODE_ENV === 'development') {
  try {
    if (!fs.existsSync(localStorageConfig.basePath)) {
      fs.mkdirSync(localStorageConfig.basePath, { recursive: true });
      console.log(`Created mock storage directory at ${localStorageConfig.basePath}`);
    }
  } catch (err) {
    console.warn('Failed to create mock storage directory:', err);
  }
}

// Connect to services on startup
const initializeServices = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('Connected to MongoDB');

    // Initialize Redis if configured
    if (redisConfig.isConfigured()) {
      await initRedisClient();
      console.log('Redis initialized');
    } else {
      console.log('Redis not configured, using local cache fallback');
    }

    // Initialize Elasticsearch if configured
    if (elasticsearchConfig.isConfigured()) {
      initElasticsearchClient();
      await createResourceIndex();
      console.log('Elasticsearch initialized');
    } else {
      console.log('Elasticsearch not configured, using basic search fallback');
    }

    // Initialize Socket.io (after server is created)
    initializeSocketIO(server);
    console.log('Socket.io initialized');
  } catch (err) {
    console.error('Service initialization error:', err);
  }
};

// Initialize all services
initializeServices();

// Routes
app.use('/api/auth', authRoutes);

// Import routes using dynamic imports
const setupRoutes = async () => {
  try {
    // Subject folders route
    const subjectFoldersModule = await import('./routes/subject-folders.routes.js');
    app.use('/api/subject-folders', subjectFoldersModule.default);
    
    // Resources routes
    const resourcesModule = await import('./routes/resources.routes.js');
    app.use('/api/resources', resourcesModule.default);
    
    // User routes
    const userModule = await import('./routes/user.routes.js');
    app.use('/api/user', userModule.default);
    
    console.log('All API routes registered successfully');
  } catch (error) {
    console.error('Error setting up routes:', error);
  }
};

// Set up routes
setupRoutes();

// Mock S3 routes for development
const setupMockRoutes = async () => {
  try {
    // Import mock handlers
    // const { mockUploadHandler, mockFileHandler } = await import('../api/upload/presigned.js');
    // app.put('/api/mock-upload', mockUploadHandler);
    // app.get('/api/mock-file/:key', mockFileHandler);
    
    console.log('Mock upload routes registered');
  } catch (error) {
    console.error('Error setting up mock routes:', error);
  }
};

if (process.env.NODE_ENV === 'development') {
  setupMockRoutes();
  // Serve mock files statically in development
  app.use('/mock-files', express.static(path.join(process.cwd(), localStorageConfig.basePath)));
}

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
      const { verifyToken } = await import('../lib/auth/jwt.js');
      const decoded:any = verifyToken(token);
      
      // Find user
      const { User } = await import('../lib/db/models/User.js');
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

// API health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Handle API 404
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `API endpoint not found: ${req.originalUrl}` });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;