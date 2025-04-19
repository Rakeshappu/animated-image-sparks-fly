import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: function(this: any) {
      return !this.googleId;
    },
  },
  googleId: {
    type: String,
    sparse: true,
  },
  role: {
    type: String,
    enum: ['student', 'faculty', 'admin'],
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    default: '',
  },
  semester: {
    type: Number,
    required: function(this: any) {
      return this.role === 'student';
    },
  },
  secretNumber: {
    type: String,
    required: function(this: any) {
      return this.role === 'faculty';
    },
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  isAdminVerified: {
    type: Boolean,
    default: false,
  },
  avatar: {
    type: String,
    default: '',
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    default: 'Male',
  },
  batch: {
    type: String,
    default: '',
  },
  degree: {
    type: String,
    default: '',
  },
  usn: {
    type: String,
    default: '',
  },
  qualification: {
    type: String,
    default: '',
  },
  designation: {
    type: String,
    default: '',
  },
  streak: {
    type: Number,
    default: 0,
  },
  lastLogin: {
    type: Date,
    default: Date.now,
  },
  notifications: [{
    message: String,
    resourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource' },
    createdAt: { type: Date, default: Date.now },
    read: { type: Boolean, default: false }
  }],
  verificationToken: String,
  verificationTokenExpiry: Date,
  verificationOTP: String,
  verificationOTPExpiry: Date,
  verificationCode: String,
  verificationCodeExpiry: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to update user streak
userSchema.methods.updateStreak = async function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastLoginDate = new Date(this.lastLogin);
  lastLoginDate.setHours(0, 0, 0, 0);
  
  const diffTime = Math.abs(today.getTime() - lastLoginDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) {
    // If last login was yesterday, increase streak
    this.streak += 1;
  } else if (diffDays > 1) {
    // If last login was more than a day ago, reset streak
    this.streak = 1;
  }
  
  this.lastLogin = new Date();
  return this.save();
};

// Method to add notification
userSchema.methods.addNotification = async function(notificationData: {
  message: string;
  resourceId?: mongoose.Types.ObjectId;
}) {
  this.notifications.unshift({
    message: notificationData.message,
    resourceId: notificationData.resourceId,
    createdAt: new Date(),
    read: false
  });
  
  // Keep only latest 50 notifications
  if (this.notifications.length > 50) {
    this.notifications = this.notifications.slice(0, 50);
  }
  
  return this.save();
};

// Method for admin to verify a user
userSchema.methods.verifyByAdmin = async function() {
  this.isAdminVerified = true;
  await this.save();
  return this;
};

// Method for admin to unverify a user
userSchema.methods.unverifyByAdmin = async function() {
  this.isAdminVerified = false;
  await this.save();
  return this;
};

// Safe export pattern for Next.js and Mongoose
let User: mongoose.Model<any>;

try {
  // Use existing model if it exists
  User = mongoose.model('User');
} catch (error) {
  // Otherwise, create a new model
  User = mongoose.model('User', userSchema);
}

export { User };
