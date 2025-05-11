
import { FacultyResource } from '../types/faculty';
import api from '../services/api';

// Use FacultyResource instead of Resource
export const groupBySemester = (resources: FacultyResource[]): Record<number, FacultyResource[]> => {
  return resources.reduce((acc, resource) => {
    const semester = resource.semester;
    if (!acc[semester]) {
      acc[semester] = [];
    }
    acc[semester].push(resource);
    return acc;
  }, {} as Record<number, FacultyResource[]>);
};

export const groupBySubject = (resources: FacultyResource[]): Record<string, FacultyResource[]> => {
  return resources.reduce((acc, resource) => {
    const subject = resource.subject;
    if (!acc[subject]) {
      acc[subject] = [];
    }
    acc[subject].push(resource);
    return acc;
  }, {} as Record<string, FacultyResource[]>);
};

export const filterResourcesByTag = (resources: FacultyResource[], tag: string): FacultyResource[] => {
  return resources.filter(resource => resource.category === tag);
};

// Add helper function to track resource views with proper source information
export const trackResourceView = async (resourceId: string, source: string = 'study-materials') => {
  try {
    console.log(`Tracking view for resource ${resourceId} from ${source}`);
    
    // Add source information to headers
    const response = await api.post(`/api/resources/${resourceId}/view`, {}, {
      headers: {
        'X-Source': source
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to track resource view:', error);
    return null;
  }
};

// Add helper for immediate view count update
export const updateResourceViewCount = (resourceId: string, newCount: number) => {
  if (typeof window !== 'undefined' && window.sharedResources) {
    // Type cast to ensure TypeScript knows we're making a valid update
    window.sharedResources = window.sharedResources.map((resource) => {
      if (resource.id === resourceId || resource._id === resourceId) {
        return {
          ...resource,
          stats: {
            ...resource.stats,
            views: newCount,
            lastViewed: new Date().toISOString()
          }
        };
      }
      return resource;
    });
  }
};
