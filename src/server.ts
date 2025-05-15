// Import server-related modules
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './lib/db/connect.js';
import authRoutes from './server/routes/auth.routes.js';

// Create Express application
const app = express();
const PORT = process.env.PORT || 10000;

// ES Module compatibility - define __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to MongoDB
const connectToMongoDB = async () => {
  try {
    console.log('Attempting MongoDB connection to:', process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/\/\/(.+?)@/, '//****@') : 'No URI provided');
    await connectDB();
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
};

connectToMongoDB();

// Middleware
app.use(cors());
app.use(express.json());

// Set proper MIME types
app.use((req, res, next) => {
  if (req.url.endsWith('.js')) {
    res.type('application/javascript');
  } else if (req.url.endsWith('.css')) {
    res.type('text/css');
  } else if (req.url.endsWith('.svg')) {
    res.type('image/svg+xml');
  }
  next();
});

// Serve static files - fixing the path for ES modules
const staticPath = path.join(__dirname, '../');
console.log('Serving static files from:', staticPath);
app.use(express.static(staticPath, {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// API routes
app.use('/api/auth', authRoutes);

// Additional API routes for resources, etc.
// - GET /api/resources
// - POST /api/resources
// - GET /api/resources/:id
// - PUT /api/resources/:id
// - DELETE /api/resources/:id

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Database status route
app.get('/api/db/status', async (req, res) => {
  try {
    const mongoose = await import('mongoose');
    const isConnected = mongoose.default.connection.readyState === 1;
    
    if (isConnected) {
      res.json({
        connected: true,
        message: 'Successfully connected to MongoDB',
      });
    } else {
      res.status(500).json({
        connected: false,
        message: 'Not connected to MongoDB',
        error: 'MongoDB connection is not established'
      });
    }
  } catch (err) {
    console.error('Error checking DB status:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error checking database status';
    
    res.status(500).json({
      connected: false,
      message: 'Failed to check MongoDB connection',
      error: errorMessage
    });
  }
});

// Wildcard route to serve React app for all other routes
app.get('*', (req, res) => {
  console.log('Wildcard route hit, serving:', path.join(__dirname, '../index.html'));
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Server error',
    message: err?.message || 'An unexpected error occurred'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});