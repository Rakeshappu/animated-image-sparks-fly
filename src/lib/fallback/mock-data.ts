import { useState, useEffect } from 'react';
import { FacultyResource, SubjectFolder } from '../../types/faculty.js';

// Mock resources when database is not available
export const mockResources = [
  {
    _id: 'mock1',
    title: 'Introduction to Data Structures',
    description: 'A comprehensive guide to basic data structures in computer science',
    type: 'document',
    subject: 'Computer Science',
    semester: 3,
    fileUrl: '/mock-files/intro-to-data-structures.pdf',
    fileSize: 1024 * 1024 * 2, // 2MB
    uploadedBy: {
      _id: 'user1',
      fullName: 'John Doe',
      email: 'john@example.com',
    },
    stats: {
      views: 120,
      downloads: 45,
      likes: 32,
      comments: 8
    },
    createdAt: new Date('2023-01-15').toISOString(),
    updatedAt: new Date('2023-01-15').toISOString(),
  },
  {
    _id: 'mock2',
    title: 'Advanced Calculus Formulas',
    description: 'Collection of essential formulas for advanced calculus',
    type: 'document',
    subject: 'Mathematics',
    semester: 4,
    fileUrl: '/mock-files/advanced-calculus.pdf',
    fileSize: 1024 * 1024 * 1.5, // 1.5MB
    uploadedBy: {
      _id: 'user2',
      fullName: 'Jane Smith',
      email: 'jane@example.com',
    },
    stats: {
      views: 98,
      downloads: 72,
      likes: 41,
      comments: 5
    },
    createdAt: new Date('2023-02-20').toISOString(),
    updatedAt: new Date('2023-02-20').toISOString(),
  },
  {
    _id: 'mock3',
    title: 'Principles of Economics',
    description: 'Introduction to micro and macroeconomics concepts',
    type: 'document',
    subject: 'Economics',
    semester: 2,
    fileUrl: '/mock-files/economics-principles.pdf',
    fileSize: 1024 * 1024 * 3, // 3MB
    uploadedBy: {
      _id: 'user3',
      fullName: 'Alex Johnson',
      email: 'alex@example.com',
    },
    stats: {
      views: 145,
      downloads: 89,
      likes: 56,
      comments: 12
    },
    createdAt: new Date('2023-03-10').toISOString(),
    updatedAt: new Date('2023-03-10').toISOString(),
  },
];

// Mock subject folders
export const mockSubjectFolders: SubjectFolder[] = [
  {
    id: 'sf1',
    name: 'Computer Science',
    semester: 3,
    // resourceCount: 15,
  },
  {
    id: 'sf2',
    name: 'Mathematics',
    semester: 4,
    // resourceCount: 12,
  },
  {
    id: 'sf3',
    name: 'Economics',
    semester: 2,
    // resourceCount: 8,
  },
  {
    id: 'sf4',
    name: 'Physics',
    semester: 3,
    // resourceCount: 10,
  },
  {
    id: 'sf5',
    name: 'Chemistry',
    semester: 1,
    // resourceCount: 6,
  },
];

// Add type guard for window object
declare global {
  interface Window {
    subjectFolders?: SubjectFolder[];
    sharedResources?: FacultyResource[];
  }
}

// Fix the usage of window.subjectFolders
export const useMockSubjectFolders = () => {
  const [folders, setFolders] = useState<SubjectFolder[]>([]);
  
  useEffect(() => {
    if (typeof window !== 'undefined' && window.subjectFolders) {
      setFolders(window.subjectFolders);
    } else {
      setFolders(mockSubjectFolders);
    }
  }, []);
  
  return folders;
};

// Add mock data to window for global access in development
if (process.env.NODE_ENV === 'development') {
  // window.mockResources = mockResources;
  window.subjectFolders = mockSubjectFolders;
}

// Helper function to get resources by query
export function getMockResourcesByQuery(query: any) {
  let filteredResources = [...mockResources];
  
  if (query.semester) {
    filteredResources = filteredResources.filter(r => r.semester === parseInt(query.semester));
  }
  
  if (query.subject) {
    filteredResources = filteredResources.filter(r => r.subject === query.subject);
  }
  
  if (query.type) {
    filteredResources = filteredResources.filter(r => r.type === query.type);
  }
  
  if (query.search) {
    const searchTerm = query.search.toLowerCase();
    filteredResources = filteredResources.filter(r => 
      r.title.toLowerCase().includes(searchTerm) || 
      r.description.toLowerCase().includes(searchTerm)
    );
  }
  
  return filteredResources;
}

// Helper function to get a resource by ID
export function getMockResourceById(id: string) {
  return mockResources.find(r => r._id === id);
}
