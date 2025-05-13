
// Add these properties to the SearchResource interface
export interface SearchResource {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  link?: string;
  fileUrl?: string;
  type?: string;
  createdAt?: string | Date;
  uploadDate?: string | Date;
  category?: string;
  placementCategory?: string;
  stats?: {
    views?: number;
    downloads?: number;
    likes?: number;
    comments?: number;
    lastViewed?: string | Date;
  };
  // Additional properties needed for InfoResult and other components
  url?: string;
  source?: string;
  author?: string;
  publishDate?: string;
  score?: number;
  thumbnailUrl?: string;
  fileContent?: string;
  // This was missing (publishedDate was being used instead of publishDate)
  publishedDate?: string;
}

// Add FacultyResource interface
export interface FacultyResource {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  fileUrl?: string;
  link?: string;
  type?: string;
  subject?: string;
  semester?: number;
  category?: 'common' | 'placement' | 'study';
  placementCategory?: string;
  uploadedBy?: string;
  uploaderId?: string;
  createdAt?: string | Date;
  uploadDate?: string | Date;
  stats?: {
    views?: number;
    downloads?: number;
    likes?: number;
    comments?: number;
    lastViewed?: string | Date;
  };
  likedBy?: string[];
  comments?: any[];
  fileName?: string;
}

// Add UploadFormData interface
export interface UploadFormData {
  title: string;
  description?: string;
  type: string;
  file?: File;
  link?: string;
  subject?: string;
  semester?: string | number;
  category?: 'common' | 'placement' | 'study';
  placementCategory?: string;
}

// Add SubjectFolder interface
export interface SubjectFolder {
  _id?: string;
  id?: string;
  name: string;
  semester: number;
  department?: string;
  resources?: string[];
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
  subjectName?: string; // Added to fix errors
  lecturerName?: string; // Added to fix errors
}

// Update SubjectData interface to match usage in code
export interface SubjectData {
  name?: string;  // Make name optional
  semester: number;
  department?: string;
  subjectName?: string; // Added to fix errors
  lecturerName?: string; // Added to fix errors
}
