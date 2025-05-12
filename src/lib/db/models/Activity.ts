
import mongoose, { Document, Schema } from 'mongoose';
// Import from the type definition file
import { ActivityActionType, ActivitySourceType } from '../../../types/activity.d';

export interface IActivity extends Document {
  user: mongoose.Types.ObjectId;
  type: ActivityActionType;
  resource?: mongoose.Types.ObjectId;
  timestamp: Date;
  message: string;
  details: any;
  source: ActivitySourceType;
  toJSON(): any;
}

// Define activity schema
const ActivitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['view', 'download', 'like', 'comment', 'upload', 'search', 'bookmark', 'share'],
  },
  resource: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource',
    required: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  message: {
    type: String,
    default: 'Activity logged'
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  source: {
    type: String,
    enum: ['study-materials', 'bookmarks', 'placement', 'other'],
    default: 'other'
  }
});

// Create compound indexes for efficient queries
ActivitySchema.index({ user: 1, timestamp: -1 });
ActivitySchema.index({ resource: 1 });
ActivitySchema.index({ type: 1 });
ActivitySchema.index({ source: 1 });

// Add method to format activity for frontend
ActivitySchema.methods.toJSON = function() {
  const obj = this.toObject();
  obj.id = obj._id.toString();
  return obj;
};

// Safe export pattern for Next.js and Mongoose
let Activity: mongoose.Model<IActivity>;

try {
  // Check if the model already exists to prevent recompilation
  Activity = mongoose.models.Activity as mongoose.Model<IActivity>;
} catch (error) {
  // If model doesn't exist yet, create it
  Activity = mongoose.model<IActivity>('Activity', ActivitySchema);
}

export { Activity };
