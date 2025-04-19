
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
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://versatileshare:versatileshare@cluster0.8aeev.mongodb.net/VersatileShare';

    if (!MONGODB_URI) {
      throw new Error('Please define the MONGODB_URI environment variable');
    }

    // Use cached connection for Next.js if available
    if (globalWithMongoose.mongoose.conn) {
      console.log('Using cached MongoDB connection');
      isConnected = true;
      return globalWithMongoose.mongoose.conn;
    }

    if (!globalWithMongoose.mongoose.promise) {
      const opts = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
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
    return globalWithMongoose.mongoose.conn;

  } catch (error) {
    console.error('MongoDB connection error:', error);
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
    
    return {
      connected: isConnected,
      state: stateMap[state as keyof typeof stateMap] || 'unknown',
      message: isConnected ? 'Connected to MongoDB database' : 'Not connected to MongoDB database',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error verifying DB connection:', error);
    return {
      connected: false,
      state: 'error',
      error: String(error),
      message: 'Failed to connect to MongoDB',
      timestamp: new Date().toISOString()
    };
  }
};

export default connectDB;
