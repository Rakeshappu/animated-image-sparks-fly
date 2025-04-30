
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
  _id: string;
  name: string;
  semester?: number; 
  lecturerName?: string;
  subjectName?: string;
}

// Define the SubjectData interface for subject creation
export interface SubjectData {
  subjectName: string;
  lecturerName: string;
  semester: number;
}

// Update the FacultyResource interface to include all needed properties
export interface FacultyResource {
  id?: string;
  _id?: string;
  title: string;
  description?: string;
  type: string;
  subject: string;
  semester: number;
  category?: string;
  placementCategory?: string;
  uploadDate?: string;
  fileName?: string;
  fileUrl?: string;
  createdAt?: string;
  likedBy?: string[];
  comments?: any[];
  fileContent?: string;
  stats?: {
    views: number;
    likes: number;
    comments: number;
    downloads: number;
    lastViewed?: string;
  };
}

// Define SearchResource interface for search results
export interface SearchResource {
  _id: string;
  id?: string;
  title: string;
  description?: string;
  type: string;
  subject?: string;
  semester?: number;
  fileUrl?: string;
  category?: string;
  placementCategory?: string;
}
