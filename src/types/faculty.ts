
export interface UploadFormData {
  title: string;
  description: string;
  type: string;
  subject: string;
  semester: number;
  department?: string;
  file?: File | null;
  link?: string;
  category?: 'study' | 'placement' | 'common';
  placementCategory?: string;
}

export interface FacultyResource extends Omit<UploadFormData, 'file'> {
  id: string;
  uploadDate: string;
  createdAt: string;
  fileName?: string;
  fileUrl?: string;
  fileContent?: string;
  category?: 'study' | 'placement' | 'common';
  uploadedByName?: string;
  uploaderId?: string;
  uploadedBy?: string; // Add this field for compatibility
  stats: {
    views: number;
    likes: number;
    comments: number;
    downloads: number;
    lastViewed: string;
  };
}
