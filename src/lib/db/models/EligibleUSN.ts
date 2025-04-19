import mongoose from 'mongoose';

// Define interfaces for type safety
export interface IEligibleUSN extends mongoose.Document {
  usn: string;
  department: string;
  semester: number;
  isUsed: boolean;
  createdAt: Date;
  createdBy: mongoose.Types.ObjectId;
}

const eligibleUSNSchema = new mongoose.Schema({
  usn: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  department: {
    type: String,
    required: true
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

// Add composite indexes for faster queries
eligibleUSNSchema.index({ usn: 1 });
eligibleUSNSchema.index({ department: 1, semester: 1 });
eligibleUSNSchema.index({ isUsed: 1, department: 1 });
eligibleUSNSchema.index({ createdAt: -1 });

// Safe export pattern for Next.js and Mongoose
let EligibleUSN: mongoose.Model<IEligibleUSN>;

try {
  // Use existing model if it exists
  EligibleUSN = mongoose.model<IEligibleUSN>('EligibleUSN');
} catch (error) {
  // Otherwise, create a new model
  EligibleUSN = mongoose.model<IEligibleUSN>('EligibleUSN', eligibleUSNSchema);
}

export { EligibleUSN };
