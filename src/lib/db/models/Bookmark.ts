
import mongoose, { Document, Schema } from 'mongoose';

// Define the Bookmark schema
const BookmarkSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resource: {
    type: Schema.Types.ObjectId,
    ref: 'Resource',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create a compound index on user and resource
BookmarkSchema.index({ user: 1, resource: 1 }, { unique: true });

// Interface for Bookmark document
export interface IBookmark extends Document {
  user: mongoose.Types.ObjectId;
  resource: mongoose.Types.ObjectId;
  createdAt: Date;
}

// Interface for Bookmark model with static methods
export interface IBookmarkModel extends mongoose.Model<IBookmark> {
  toggleBookmark(
    userId: string | mongoose.Types.ObjectId, 
    resourceId: string | mongoose.Types.ObjectId
  ): Promise<{ bookmarked: boolean }>;
}

// Add toggleBookmark static method
BookmarkSchema.statics.toggleBookmark = async function(
  userId: string | mongoose.Types.ObjectId,
  resourceId: string | mongoose.Types.ObjectId
): Promise<{ bookmarked: boolean }> {
  
  // Convert string IDs to ObjectIds if needed
  const userObjectId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
  const resourceObjectId = typeof resourceId === 'string' ? new mongoose.Types.ObjectId(resourceId) : resourceId;
  
  // Check if bookmark exists
  const existingBookmark = await this.findOne({
    user: userObjectId,
    resource: resourceObjectId
  });
  
  if (existingBookmark) {
    // If bookmark exists, remove it
    await this.deleteOne({
      user: userObjectId,
      resource: resourceObjectId
    });
    return { bookmarked: false };
  } else {
    // If bookmark doesn't exist, create it
    await this.create({
      user: userObjectId,
      resource: resourceObjectId
    });
    return { bookmarked: true };
  }
};

// Define and export the Bookmark model
let Bookmark: IBookmarkModel;

try {
  Bookmark = mongoose.models.Bookmark as IBookmarkModel;
} catch (error) {
  Bookmark = mongoose.model<IBookmark, IBookmarkModel>('Bookmark', BookmarkSchema);
}

export { Bookmark };
