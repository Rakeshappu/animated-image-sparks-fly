
import { Resource } from '../types';
import api from '../services/api';

export const groupBySemester = (resources: Resource[]): Record<number, Resource[]> => {
  return resources.reduce((acc, resource) => {
    const semester = resource.semester;
    if (!acc[semester]) {
      acc[semester] = [];
    }
    acc[semester].push(resource);
    return acc;
  }, {} as Record<number, Resource[]>);
};

export const groupBySubject = (resources: Resource[]): Record<string, Resource[]> => {
  return resources.reduce((acc, resource) => {
    const subject = resource.subject;
    if (!acc[subject]) {
      acc[subject] = [];
    }
    acc[subject].push(resource);
    return acc;
  }, {} as Record<string, Resource[]>);
};

export const filterResourcesByTag = (resources: Resource[], tag: string): Resource[] => {
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
    window.sharedResources = window.sharedResources.map(resource => {
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
