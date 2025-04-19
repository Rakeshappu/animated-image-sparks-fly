import mongoose from 'mongoose';
import { User } from './models/User';
import { Resource } from './models/Resource';

export async function initDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected to MongoDB');

    // Create collections if they don't exist
    await Promise.all([
      User.createCollection(),
      Resource.createCollection(),
    ]);

    // Create indexes
    await Promise.all([
      User.collection.createIndex({ email: 1 }, { unique: true }),
      User.collection.createIndex({ googleId: 1 }, { sparse: true }),
      Resource.collection.createIndex({ uploadedBy: 1 }),
      Resource.collection.createIndex({ semester: 1 }),
      Resource.collection.createIndex({ type: 1 }),
    ]);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}