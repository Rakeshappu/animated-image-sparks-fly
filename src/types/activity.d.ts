
import { Types } from 'mongoose';

export interface ActivityDocument {
  _id: Types.ObjectId;
  user: Types.ObjectId | string;
  type: 'view' | 'download' | 'like' | 'comment' | 'upload' | 'search' | 'bookmark';
  resource?: Types.ObjectId | string;
  resourceId?: string; // Add this field
  timestamp: Date;
  message: string;
  details: any;
  source: 'study-materials' | 'bookmarks' | 'placement' | 'other';
}
