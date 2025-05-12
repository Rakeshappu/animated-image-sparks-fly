
import { Types } from 'mongoose';

export type ActivitySourceType = 'study-materials' | 'bookmarks' | 'placement' | 'other';
export type ActivityActionType = 'view' | 'download' | 'like' | 'comment' | 'upload' | 'search' | 'bookmark' | 'share';

export interface ActivityDocument {
  _id: Types.ObjectId | string;
  user: Types.ObjectId | string;
  type: ActivityActionType;
  resource?: Types.ObjectId | string;
  resourceId?: string;
  timestamp: Date;
  message: string;
  details: any;
  source: ActivitySourceType;
}

// Interface for client-side activity representation
export interface Activity {
  _id: string;
  type: ActivityActionType;
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
