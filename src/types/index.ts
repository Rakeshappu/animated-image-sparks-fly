
import { UserRole } from './auth';

export interface User {
  _id?: string;
  fullName: string;
  email: string;
  role: UserRole;
  department: string;
  phoneNumber: string;
  semester?: number;
  secretNumber?: string;
  isEmailVerified: boolean;
  isVerified?: boolean;
  streak?: number;
  avatar?: string;
  googleId?: string;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'document' | 'video' | 'link' | 'note';
  subject: string;
  semester: number;
  department: string;
  uploadedBy: string;
  views: number;
  downloads: number;
  category?: string;
  timestamp: string;
  fileUrl?: string;
}

export interface Activity {
  _id: string;
  userId: string;
  type: 'upload' | 'download' | 'view' | 'like' | 'comment' | 'share';
  resourceId?: string;
  resource?: {
    title: string;
    type: string;
  };
  message: string;
  timestamp: string;
}

export type { UserRole } from './auth.ts';
