
import { Resource } from '../types/index';
import { FacultyResource } from '../types/faculty';

export const filterResourcesBySemester = (
  resources: Resource[],
  semester: number
): Resource[] => {
  return resources.filter((resource) => resource.semester === semester);
};

export const filterResourcesByCategory = (
  resources: Resource[],
  category: string
): Resource[] => {
  return resources.filter((resource) => resource.category === category);
};

export const sortResourcesByViews = (resources: Resource[]): Resource[] => {
  return [...resources].sort((a, b) => b.views - a.views);
};

export const sortResourcesByDownloads = (resources: Resource[]): Resource[] => {
  return [...resources].sort((a, b) => b.downloads - a.downloads);
};

export const sortResourcesByDate = (resources: Resource[]): Resource[] => {
  return [...resources].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};

// Add new utility function to properly read files
export const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        resolve(reader.result as string);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => {
      reject(reader.error);
    };
    
    // For PDFs and other binary files, use readAsDataURL instead of readAsText
    reader.readAsDataURL(file);
  });
};

// Utility to determine file MIME type
export const getFileMimeType = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'pdf':
      return 'application/pdf';
    case 'doc':
    case 'docx':
      return 'application/msword';
    case 'ppt':
    case 'pptx':
      return 'application/vnd.ms-powerpoint';
    case 'xls':
    case 'xlsx':
      return 'application/vnd.ms-excel';
    case 'txt':
      return 'text/plain';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    default:
      return 'application/octet-stream';
  }
};
