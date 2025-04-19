
import mongoose from 'mongoose';

const ActivitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['view', 'download', 'like', 'comment', 'upload', 'share'],
    required: true
  },
  resource: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource',
    required: true
  },
  details: {
    type: Object,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Define a virtual for a user-friendly ID
ActivitySchema.virtual('id').get(function() {
  return this._id.toString();
});

// Configure the schema to include virtuals when converting to JSON
ActivitySchema.set('toJSON', {
  virtuals: true,
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  }
});

export const Activity = mongoose.models.Activity || mongoose.model('Activity', ActivitySchema);
