
export interface UploadFormData {
  title: string;
  description: string;
  type: string;
  subject: string;
  semester: number;
  file?: File | null;
  link?: string;
  category?: string;
  placementCategory?: string;
}

export interface SubjectFolder {
  _id?: string;
  id?: string;
  name?: string;
  subjectName?: string;
  lecturerName?: string;
  semester?: number;
  code?: string;
  department?: string;
}

// Define the SubjectData interface for subject creation
export interface SubjectData {
  subjectName: string;
  lecturerName: string;
  semester: number;
  name?: string;
  department?: string;
}

// Update the FacultyResource interface to include all needed properties
export interface FacultyResource {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  fileUrl?: string;
  link?: string;

  type?: string;
  subject: string; // Make subject required
  semester?: number;
  category?: 'common' | 'placement' | 'study';
  placementCategory?: string;
  uploadedBy?: string;
  uploaderId?: string;
  uploadedByName?: string;
  department?: string;  // Adding department property
  createdAt?: string | Date;
  uploadDate?: string | Date;
  stats: {
    views: number;
    downloads?: number;
    likes?: number;
    comments?: number;
    lastViewed?: string | Date;
  };
  likedBy?: string[];
  comments?: any[];
  fileName?: string;
}
// Define SearchResource interface for search results
export interface SearchResource {
  score: any;

  id?: string;
  title: string;
  description?: string;
  type: string;
  subject?: string;
  semester?: number;
  fileUrl?: string;
  category?: string;
  placementCategory?: string;
  url?: string;
  thumbnailUrl?: string;
  publishedDate?: string;
  source?: string;
  author?: string;
}
