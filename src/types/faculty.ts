
export interface ResourceStats {
  views: number;
  likes: number;
  comments: number;
  downloads: number;
  lastViewed: string;
}

export interface ResourceAnalytics extends ResourceStats {
  dailyViews: { date: string; count: number }[];
  topDepartments: { name: string; count: number }[];
  studentFeedback: { rating: number; count: number }[];
}

export interface FacultyResource {
  createdAt: string;
  id: string;
  title: string;
  description: string;
  type: 'document' | 'video' | 'note' | 'link';
  subject: string;
  semester: number;
  uploadDate: string;
  fileUrl?: string;
  fileSize?: number;
  // Add actual file content and name to open documents
  fileContent?: string;
  fileName?: string;
  // For link resources
  link?: string;
  stats: ResourceStats;
  // Add folder information
  folderId?: string;
  // Add placement category
  category?: string;
  placementCategory?: string;
}

export interface UploadFormData {
  title: string;
  description: string;
  type: FacultyResource['type'];
  subject: string;
  semester: number;
  file?: File;
  link?: string;
  folderId?: string; // Add folder ID for organization
  category?: string; // Add category field
  placementCategory?: string; // Add placement category field
}

export interface SubjectFolder {
  id: string;
  name: string;
  semester: number;
  lecturerName: string;
  resourceCount: number;
  createdAt: string;
  subjectName?: string; // Add optional subjectName for compatibility
}

export interface ResourceCategory {
  id: string;
  name: 'semester' | 'common' | 'placement';
  displayName: string;
  description: string;
  iconName: string;
}

// Add this new interface for subject data management
export interface SubjectData {
  subjectName: string;
  lecturerName: string;
  semester: number;
}

// Define a new interface for folder structure
export interface ResourceFolder {
  id: string;
  name: string;
  semester: number;
  createdAt: string;
  resources: FacultyResource[];
}

// Add interface for declaring window properties
declare global {
  interface Window {
    sharedResources: FacultyResource[];
    subjectFolders: SubjectFolder[];
    resourceFolders: ResourceFolder[];
  }
}
