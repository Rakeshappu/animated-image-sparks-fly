
import { FacultyResource } from './faculty';
import mongoose from 'mongoose';

declare global {
  interface Window {
    sharedResources: FacultyResource[];
    mockResources?: any[]; // Added missing property
  }

  // Augment mongoose module to help with type checking
  namespace mongoose {
    // These type definitions help with implicit any errors
    interface Resource extends mongoose.Document {
      // Basic resource properties
      title: string;
      description: string;
      type: 'document' | 'video' | 'note' | 'link';
      subject: string;
      semester: number;
      department: string;
      uploadedBy: mongoose.Types.ObjectId;
      fileUrl: string | null;
      fileName: string | null;
      fileSize: number;
      link: string | null;

      // Statistics
      stats: {
        views: number;
        downloads: number;
        likes: number;
        comments: number;
        lastViewed: Date;
        dailyViews: Array<{
          date: Date;
          count: number;
        }>;
        studentFeedback: Array<{
          rating: number;
          count: number;
        }>;
      };

      // Categorization
      category: 'study' | 'placement' | 'common';
      placementCategory: string;
      tags: string[];

      // Relations and interactions
      likedBy: mongoose.Types.ObjectId[];
      comments: Array<{
        content: string;
        author: mongoose.Types.ObjectId;
        createdAt: Date;
      }>;

      // Timestamps
      createdAt: Date;
      updatedAt: Date;
      deletedAt: Date | null;

      // Methods
      softDelete(): Promise<any>;
      restore(): Promise<any>;
    }

    interface Activity extends mongoose.Document {
      user: mongoose.Types.ObjectId;
      type: 'view' | 'download' | 'like' | 'comment' | 'upload' | 'search' | 'bookmark';
      resource?: mongoose.Types.ObjectId;
      timestamp: Date;
      message: string;
      details: any;
      source: 'study-materials' | 'bookmarks' | 'placement' | 'other';
    }
  }
}

export {};
