import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './lib/db/connect.js';
import authRoutes from './server/routes/auth.routes.js';
import { errorHandler } from './server/middleware/error.middleware.js';
import { initializeSocketIO } from './lib/realtime/socket.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors({
  origin: ['http://localhost:8080', 'https://versatileshare-b57k.onrender.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/auth', authRoutes);

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

// Handle API 404
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `API endpoint not found: ${req.originalUrl}` });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  // Get the directory name
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
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
    
  } catch (err:any) {
    console.error('Failed to connect to MongoDB:', err.message);
    // Continue starting the server even if DB connection fails
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} (without MongoDB connection)`);
    });
  }
};

// Required for the DB status endpoint
import mongoose from 'mongoose';

startServer();

// For testing/development
export default app;