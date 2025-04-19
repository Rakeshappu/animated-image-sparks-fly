import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource'
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Helper methods as static methods on the schema
notificationSchema.statics.createNotification = async function(data: {
  userId: mongoose.Types.ObjectId | string;
  message: string;
  resourceId?: mongoose.Types.ObjectId | string;
}) {
  return this.create({
    userId: data.userId,
    message: data.message,
    resourceId: data.resourceId,
    read: false,
    createdAt: new Date()
  });
};

notificationSchema.statics.getUnreadCount = async function(userId: mongoose.Types.ObjectId | string) {
  return this.countDocuments({ userId, read: false });
};

// Safety check for model definition
const NotificationModel = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

// Export the interface
export interface INotification {
  _id?: string;
  userId: string;
  message: string;
  resourceId?: string;
  read: boolean;
  createdAt: Date | string;
}

export { NotificationModel as Notification };
