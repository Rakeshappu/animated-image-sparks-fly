import api from './api';
import { API_ROUTES } from '../lib/api/routes';

// Centralized error handling for resource service
const handleServiceError = (error: any, fallbackMessage: string) => {
  console.error(fallbackMessage, error);
  
  // Check if we received HTML instead of JSON (routing issue)
  if (error.response?.data && typeof error.response.data === 'string' && 
      error.response.data.includes('<!doctype html>')) {
    console.error('Received HTML instead of JSON for resource service request');
    return {
      error: 'API routing error: Received HTML instead of JSON. Server routing issue detected.',
      message: fallbackMessage
    };
  }
  
  const errorMessage = error.response?.data?.error || 
                       error.message || 
                       fallbackMessage;
                       
  return {
    error: errorMessage,
    message: fallbackMessage
  };
};

// Export the function directly for easy access
export const checkDatabaseConnection = async () => {
  try {
    const response = await api.get('/api/db/status');
    return response.data;
  } catch (err: any) {
    console.error('Error checking DB connection:', err);
    
    // Check if we received HTML instead of JSON (routing issue)
    if (err.response?.data && typeof err.response.data === 'string' && 
        err.response.data.includes('<!doctype html>')) {
      console.error('Received HTML instead of JSON for DB status check');
      return {
        connected: false,
        error: 'API returned HTML instead of JSON. Server routing issue detected.',
        message: 'Failed to connect to MongoDB'
      };
    }
    
    return {
      connected: false,
      error: err instanceof Error ? err.message : 'Unknown error checking database connection',
      message: 'Failed to check connection to MongoDB'
    };
  }
};

export const resourceService = {
  checkDatabaseConnection,
  getResources: async () => {
    try {
      const response = await api.get(API_ROUTES.RESOURCES.LIST);
      return response.data;
    } catch (error: any) {
      return handleServiceError(error, 'Failed to fetch resources');
    }
  },

  getResource: async (id: string) => {
    try {
      const response = await api.get(API_ROUTES.RESOURCES.GET(id));
      return response.data;
    } catch (error: any) {
      return handleServiceError(error, 'Failed to fetch resource');
    }
  },

  createResource: async (resourceData: any) => {
    try {
      const response = await api.post(API_ROUTES.RESOURCES.CREATE, resourceData);
      return response.data;
    } catch (error: any) {
      return handleServiceError(error, 'Failed to create resource');
    }
  },

  updateResource: async (id: string, resourceData: any) => {
    try {
      const response = await api.put(API_ROUTES.RESOURCES.UPDATE(id), resourceData);
      return response.data;
    } catch (error: any) {
      return handleServiceError(error, 'Failed to update resource');
    }
  },

  deleteResource: async (id: string) => {
    try {
      const response = await api.delete(API_ROUTES.RESOURCES.DELETE(id));
      return response.data;
    } catch (error: any) {
      return handleServiceError(error, 'Failed to delete resource');
    }
  },

  likeResource: async (id: string) => {
    try {
      const response = await api.post(API_ROUTES.RESOURCES.LIKE(id));
      return response.data;
    } catch (error: any) {
      return handleServiceError(error, 'Failed to like resource');
    }
  },

  getLikeStatus: async (id: string) => {
    try {
      const response = await api.get(API_ROUTES.RESOURCES.LIKE_STATUS(id));
      return response.data;
    } catch (error: any) {
      return handleServiceError(error, 'Failed to get like status');
    }
  },

  getComments: async (id: string) => {
    try {
      const response = await api.get(API_ROUTES.RESOURCES.COMMENTS(id));
      return response.data;
    } catch (error: any) {
      return handleServiceError(error, 'Failed to get comments');
    }
  },

  addComment: async (id: string, commentData: any) => {
    try {
      const response = await api.post(API_ROUTES.RESOURCES.COMMENTS(id), commentData);
      return response.data;
    } catch (error: any) {
      return handleServiceError(error, 'Failed to add comment');
    }
  },

  getFaculty: async () => {
    try {
      const response = await api.get(API_ROUTES.RESOURCES.FACULTY);
      return response.data;
    } catch (error: any) {
      return handleServiceError(error, 'Failed to get faculty');
    }
  },

  getPlacement: async () => {
    try {
      const response = await api.get(API_ROUTES.RESOURCES.PLACEMENT);
      return response.data;
    } catch (error: any) {
      return handleServiceError(error, 'Failed to get placement');
    }
  },

  getStats: async () => {
    try {
      const response = await api.get(API_ROUTES.RESOURCES.STATS);
      return response.data;
    } catch (error: any) {
      return handleServiceError(error, 'Failed to get stats');
    }
  },

  getAnalytics: async (id: string) => {
    try {
      const response = await api.get(API_ROUTES.RESOURCES.ANALYTICS(id));
      return response.data;
    } catch (error: any) {
      return handleServiceError(error, 'Failed to get analytics');
    }
  },
};

// Export a default function for createResource for backwards compatibility
export const createResource = async (resourceData?: any) => {
  return resourceService.createResource(resourceData);
};

export const getResources = async () => {
  return resourceService.getResources();
};

export default resourceService;
