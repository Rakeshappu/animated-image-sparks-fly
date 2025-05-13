//src\lib\db\models\Resource.ts
import mongoose, { Document, Schema } from 'mongoose';
import { getAllCategoryIds, getStandardizedCategory } from '../../../utils/placementCategoryUtils';

// Define a daily view schema for statistics
const DailyViewSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now
  },
  count: {
    type: Number,
    default: 0
  }
});

// Define student feedback schema
const StudentFeedbackSchema = new mongoose.Schema({
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  count: {
    type: Number,
    default: 0
  }
});

// Define stats schema
const StatsSchema = new mongoose.Schema({
  views: {
    type: Number,
    default: 0
  },
  downloads: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  comments: {
    type: Number,
    default: 0
  },
  lastViewed: {
    type: Date,
    default: Date.now
  },
  dailyViews: {
    type: [DailyViewSchema],
    default: function() { return []; }
  },
  studentFeedback: {
    type: [StudentFeedbackSchema],
    default: function() { return []; }
  }
});

// Define the Resource schema
const ResourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    required: true,
    enum: ['document', 'video', 'note', 'link'],
    default: 'document'
  },
  subject: {
    type: String,
    required: true
  },
  semester: {
    type: Number,
    required: true,
    min: 0,
    max: 8
  },
  department: {
    type: String,
    required: false,
    default: 'Common'
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  fileUrl: {
    type: String,
    default: null
  },
  fileName: {
    type: String,
    default: null
  },
  fileSize: {
    type: Number,
    default: 0
  },
  link: {
    type: String,
    default: null
  },
  stats: {
    type: StatsSchema,
    default: function() {
      return {
        views: 0,
        downloads: 0,
        likes: 0,
        comments: 0,
        lastViewed: new Date(),
        dailyViews: [],
        studentFeedback: []
      };
    }
  },
  category: {
    type: String,
    enum: ['study', 'placement', 'common'],
    default: 'study'
  },
  placementCategory: {
    type: String,
    enum: getAllCategoryIds(),
    default: 'general'
  },
  tags: [{
    type: String
  }],
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: {
    type: [{
      content: {
        type: String,
        required: true
      },
      author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    default: function() { return []; }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  deletedAt: {
    type: Date,
    default: null
  }
});

// Pre-save middleware
ResourceSchema.pre('save', function(next) {
  // Update the updatedAt field
  this.updatedAt = new Date();
  
  // If it's a placement resource, ensure semester is set to 0
  if (this.category === 'placement' && this.semester !== 0) {
    this.semester = 0;
  }
  
  // Before saving, make sure placementCategory is standardized
  if (this.category === 'placement' && this.placementCategory) {
    this.placementCategory = getStandardizedCategory(this.placementCategory);
  }
  
  // Initialize stats if they don't exist
  if (!this.stats) {
    this.stats = {
      views: 0,
      downloads: 0,
      likes: 0,
      comments: 0,
      lastViewed: new Date(),
      dailyViews: [],
      studentFeedback: [],
      
    };
  }
  
  next();
});

// Add method for soft deletion
ResourceSchema.methods.softDelete = async function() {
  this.deletedAt = new Date();
  await this.save();
  return this;
};

// Add method for restoration
ResourceSchema.methods.restore = async function() {
  this.deletedAt = null;
  await this.save();
  return this;
};

// Update find operations to exclude soft-deleted items by default
ResourceSchema.pre('find', function() {
  // @ts-ignore - this condition is valid for mongoose queries
  if (!this.getQuery().includeSoftDeleted) {
    this.where({ deletedAt: null });
  } else {
    // @ts-ignore - this is a custom property we're using
    delete this.getQuery().includeSoftDeleted;
  }
});

ResourceSchema.pre('findOne', function() {
  // @ts-ignore - this condition is valid for mongoose queries
  if (!this.getQuery().includeSoftDeleted) {
    this.where({ deletedAt: null });
  } else {
    // @ts-ignore - this is a custom property we're using
    delete this.getQuery().includeSoftDeleted;
  }
});

// Define a virtual for a user-friendly ID
ResourceSchema.virtual('id').get(function() {
  return this._id.toString();
});

// Configure the schema to include virtuals when converting to JSON
ResourceSchema.set('toJSON', {
  virtuals: true,
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  }
});

// Define Resource interface
export interface IResource extends Document {
  title: string;
  description: string;
  type: 'document' | 'video' | 'note' | 'link';
  subject: string;
  semester: number;
  department?: string;
  uploadedBy?: mongoose.Types.ObjectId;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  link?: string;
  stats: {
    views: number;
    downloads: number;
    likes: number;
    comments: number;
    lastViewed: Date;
    dailyViews: Array<{ date: Date; count: number }>;
    studentFeedback: Array<{ rating: number; count: number }>;
  };
  category?: 'study' | 'placement' | 'common';
  placementCategory?: string;
  tags?: string[];
  likedBy?: mongoose.Types.ObjectId[];
  comments?: Array<{ 
    content: string; 
    author: mongoose.Types.ObjectId; 
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  id?: string;
  softDelete(): Promise<IResource>;
  restore(): Promise<IResource>;
}

// Safe export pattern for Next.js and Mongoose
let Resource: mongoose.Model<IResource>;

try {
  // Check if the model already exists to prevent recompilation
  Resource = mongoose.models.Resource as mongoose.Model<IResource>;
} catch (error) {
  // If model doesn't exist yet, create it
  Resource = mongoose.model<IResource>('Resource', ResourceSchema);
}

export { Resource };
