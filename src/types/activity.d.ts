
import { Types } from 'mongoose';

export interface ActivityDocument {
  _id: Types.ObjectId | string;
  user: Types.ObjectId | string;
  type: 'view' | 'download' | 'like' | 'comment' | 'upload' | 'search' | 'bookmark' | 'share';
  resource?: Types.ObjectId | string;
  resourceId?: string;
  timestamp: Date;
  message: string;
  details: any;
  source: 'study-materials' | 'bookmarks' | 'placement' | 'other';
}

// Interface for client-side activity representation
export interface Activity {
  _id: string;
  type: 'view' | 'download' | 'like' | 'comment' | 'upload' | 'share';
  timestamp: string;
  message?: string;
  resource?: {
    _id: string;
    title: string;
    fileUrl?: string;
    subject: string;
    category?: string;
    stats?: {
      views: number;
      downloads: number;
      likes: number;
      comments: number;
    };
  };
}
