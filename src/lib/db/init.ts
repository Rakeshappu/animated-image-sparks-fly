import mongoose from 'mongoose';
import { User } from './models/User.js';
import { Resource, IResource } from './models/Resource.js';
import { Activity } from './models/Activity.js';

export async function initDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected to MongoDB');

    // Create collections if they don't exist
    await Promise.all([
      User.createCollection(),
      Resource.createCollection(),
      Activity.createCollection(),
    ]);

    // Create indexes
    await Promise.all([
      User.collection.createIndex({ email: 1 }, { unique: true }),
      User.collection.createIndex({ googleId: 1 }, { sparse: true }),
      Resource.collection.createIndex({ uploadedBy: 1 }),
      Resource.collection.createIndex({ semester: 1 }),
      Resource.collection.createIndex({ type: 1 }),
      Activity.collection.createIndex({ user: 1, timestamp: -1 }),
      Activity.collection.createIndex({ resource: 1 }),
      Activity.collection.createIndex({ type: 1 }),
      Activity.collection.createIndex({ source: 1 }),
    ]);

    // Log the models available for the MongoDB status banner
    const modelNames = mongoose.modelNames();
    console.log('Available models:', modelNames);

    console.log('Database initialized successfully');
    return {
      connected: true,
      message: 'Connected to MongoDB database',
      serverInfo: {
        host: mongoose.connection.host,
        name: mongoose.connection.name,
        models: modelNames
      }
    };
  } catch (error) {
    console.error('Database initialization failed:', error);
    return {
      connected: false,
      message: error instanceof Error ? error.message : 'Failed to connect to MongoDB',
      error
    };
  }
}
