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

// ES Module compatibility - define __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8080'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Pre-flight requests
app.options('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8080'],
  credentials: true
}));

app.use(express.json());

// Set proper MIME types
app.use((req, res, next) => {
  if (req.url.endsWith('.js')) {
    res.type('application/javascript');
  } else if (req.url.endsWith('.css')) {
    res.type('text/css');
  }
  next();
});

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
app.use('/auth', authRoutes);

// Mock S3 routes for development
// Import mock handlers
const { mockUploadHandler, mockFileHandler } = require('../api/upload/presigned');
app.put('/api/mock-upload', mockUploadHandler);
app.get('/api/mock-file/:key', mockFileHandler);

// Serve mock files statically in development
if (process.env.NODE_ENV === 'development') {
  app.use('/mock-files', express.static(path.join(process.cwd(), localStorageConfig.basePath)));
}

// API health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
