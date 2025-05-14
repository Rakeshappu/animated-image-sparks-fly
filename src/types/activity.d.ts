
import { ObjectId } from 'mongoose';

export type ActivityType = 'view' | 'download' | 'like' | 'comment' | 'upload' | 'search' | 'bookmark' | 'share';
export type ActivitySourceType = 'study-materials' | 'bookmarks' | 'placement' | 'other';

export interface ActivityStats {
  count: number;
  lastActivity?: Date;
}

export interface Activity {
  _id: string;
  type: ActivityType;
  timestamp: string;
  message: string;
  source?: ActivitySourceType;
  details?: any;
  resource?: {
    _id: string;
    title?: string;
    subject?: string;
    category?: string;
    placementCategory?: string;
    stats?: {
      views?: number;
      downloads?: number;
      likes?: number;
      comments?: number;
    };
  };
}

export interface ActivityDocument {
  _id: ObjectId | string;
  user: ObjectId | string;
  type: ActivityType;
  resource?: ObjectId | string;
  timestamp: Date | string;
  message: string;
  details?: any;
  source?: ActivitySourceType;
}

export interface ActivityLogParams {
  type: ActivityType;
  resourceId: string;
  message: string;
  source?: ActivitySourceType;
  details?: any;
}
