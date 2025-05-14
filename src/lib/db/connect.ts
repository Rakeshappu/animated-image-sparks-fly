
import mongoose from 'mongoose';

// Track connection status
let isConnected = false;

// For Next.js cached connection pattern
const globalWithMongoose = global as any;
globalWithMongoose.mongoose = globalWithMongoose.mongoose || { conn: null, promise: null };

/**
 * Connect to MongoDB
 * Implements cached connection pattern for serverless environments
 */
const connectDB = async () => {
  // If we're already connected, return the existing connection
  if (isConnected) {
    console.log('Using existing MongoDB connection');
    return mongoose;
  }

  try {
    const MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
      console.error('MONGODB_URI environment variable is not defined');
      throw new Error('Please define the MONGODB_URI environment variable');
    }

    // Log the connection attempt (masking credentials for security)
    const sanitizedUri = MONGODB_URI.replace(
      /mongodb(\+srv)?:\/\/([^:]+):([^@]+)@/,
      'mongodb$1://$2:****@'
    );
    console.log(`Attempting MongoDB connection to: ${sanitizedUri}`);

    // Use cached connection for Next.js if available
    if (globalWithMongoose.mongoose.conn) {
      console.log('Using cached MongoDB connection');
      isConnected = true;
      return globalWithMongoose.mongoose.conn;
    }

    if (!globalWithMongoose.mongoose.promise) {
      // Clean up deprecated options while maintaining compatibility
      const opts = {
        serverSelectionTimeoutMS: 10000, // 10 seconds to select a server before timeout (increased from 5s)
        socketTimeoutMS: 45000,         // 45 seconds for socket operations
        connectTimeoutMS: 30000,        // 30 seconds for initial connection
        retryWrites: true,              // Retry write operations if they fail
        retryReads: true                // Retry read operations if they fail
      } as mongoose.ConnectOptions;

      // Create new connection
      globalWithMongoose.mongoose.promise = mongoose.connect(MONGODB_URI, opts)
        .then((mongoose) => {
          console.log('New MongoDB connection established');
          return mongoose;
        });
    }

    // Wait for connection to be established
    globalWithMongoose.mongoose.conn = await globalWithMongoose.mongoose.promise;
    isConnected = true;
    
    // Add connection event listeners for better error handling
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      isConnected = false;
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Will try to reconnect on next request.');
      isConnected = false;
    });
    
    return globalWithMongoose.mongoose.conn;

  } catch (error: any) {
    console.error('MongoDB connection error:', error.message);
    if (error.name === 'MongoServerSelectionError') {
      console.error('Failed to select a MongoDB server. This could be due to network restrictions or incorrect credentials.');
    }
    isConnected = false;
    throw error;
  }
};

/**
 * Verify DB connection status
 */
export const verifyDbConnection = async () => {
  try {
    await connectDB();
    
    // Check connection state
    const state = mongoose.connection.readyState;
    const stateMap = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    const isConnected = state === 1;
    
    const connectionInfo = mongoose.connection.db?.databaseName ? 
      `Connected to database: ${mongoose.connection.db.databaseName}` : 
      'Not connected to any database';
    
    return {
      connected: isConnected,
      state: stateMap[state as keyof typeof stateMap] || 'unknown',
      message: isConnected ? connectionInfo : 'Not connected to MongoDB database',
      timestamp: new Date().toISOString(),
      host: mongoose.connection.host || 'unknown',
      database: mongoose.connection.db?.databaseName || 'unknown'
    };
  } catch (error) {
    console.error('Error verifying DB connection:', error);
    return {
      connected: false,
      state: 'error',
      error: error instanceof Error ? error.message : String(error),
      message: 'Failed to connect to MongoDB',
      timestamp: new Date().toISOString()
    };
  }
};

export default connectDB;
