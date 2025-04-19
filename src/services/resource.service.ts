import api from './api';
import socketService from './socket.service';
import { getCache, setCache, deleteCache } from '../lib/cache/redis';
import { API_ROUTES } from '../lib/api/routes';
import { getMockResourcesByQuery, getMockResourceById } from '../lib/fallback/mock-data';
import { s3Config, redisConfig } from '../lib/config/services';

interface ResourceQuery {
  semester?: number;
  subject?: string;
  type?: string;
  search?: string;
  limit?: number;
  page?: number;
  category?: string;
  placementCategory?: string;
}

/**
 * Fetch resources based on query parameters
 */
export const getResources = async (query: ResourceQuery = {}) => {
  try {
    // If in development or testing and services not configured, use mock data
    if (process.env.NODE_ENV === 'development' && !s3Config.isConfigured()) {
      console.log('Using mock resources data');
      return getMockResourcesByQuery(query);
    }
    
    const queryString = new URLSearchParams();
    
    if (query.semester) queryString.append('semester', query.semester.toString());
    if (query.subject) queryString.append('subject', query.subject);
    if (query.type) queryString.append('type', query.type);
    if (query.search) queryString.append('search', query.search);
    if (query.limit) queryString.append('limit', query.limit.toString());
    if (query.page) queryString.append('page', query.page.toString());
    if (query.category) queryString.append('category', query.category);
    if (query.placementCategory) queryString.append('placementCategory', query.placementCategory);
    
    // Try to get from cache first if Redis is configured
    if (!redisConfig.useMocks) {
      const cacheKey = `resources:${queryString.toString()}`;
      const cachedResources = await getCache(cacheKey);
      
      if (cachedResources) {
        console.log('Returning cached resources');
        return cachedResources;
      }
    }
    
    console.log('Fetching resources with query:', queryString.toString());
    const response = await api.get(`${API_ROUTES.RESOURCES.LIST}?${queryString}`);
    
    // Cache results if Redis is configured
    if (!redisConfig.useMocks) {
      const cacheKey = `resources:${queryString.toString()}`;
      await setCache(cacheKey, response.data.resources, 300);
    }
    
    return response.data.resources;
  } catch (error) {
    console.error('Failed to get resources:', error);
    
    // Fallback to mock data in case of errors
    if (process.env.NODE_ENV === 'development') {
      console.log('Using mock resources data as fallback');
      return getMockResourcesByQuery(query);
    }
    
    throw error;
  }
};

/**
 * Create a new resource
 * Handles both direct uploads and S3 presigned URL uploads
 */
export const createResource = async (resourceData: FormData) => {
  try {
    console.log('Creating resource with data:', Object.fromEntries(resourceData.entries()));
    
    // Check if this is a placement resource
    const isPlacementResource = resourceData.get('category') === 'placement';
    const endpoint = isPlacementResource ? API_ROUTES.RESOURCES.PLACEMENT : API_ROUTES.RESOURCES.CREATE;
    
    // For large files, get a presigned S3 URL first
    const fileInput = resourceData.get('file') as File;
    
    if (fileInput && fileInput.size > 5 * 1024 * 1024) { // 5MB threshold
      // Get presigned URL for S3 upload
      const presignedResponse = await api.post(API_ROUTES.STORAGE.PRESIGNED, {
        fileName: fileInput.name,
        fileType: fileInput.type,
        fileSize: fileInput.size
      });
      
      // Upload directly to S3
      await fetch(presignedResponse.data.uploadUrl, {
        method: 'PUT',
        body: fileInput,
        headers: {
          'Content-Type': fileInput.type
        }
      });
      
      // Update the form data to include the S3 file URL instead of the file
      resourceData.delete('file');
      resourceData.append('fileUrl', presignedResponse.data.fileUrl);
      resourceData.append('fileSize', fileInput.size.toString());
    }
    
    // Create the resource with the file URL (or with the file for smaller files)
    const response = await fetch(endpoint, {
      method: 'POST',
      body: resourceData,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Upload error response:', errorData);
      throw new Error(errorData.error || 'Failed to create resource');
    }
    
    const data = await response.json();
    
    // Clear cache for resources if Redis is configured
    if (!redisConfig.useMocks) {
      await deleteCache('resources:*');
    }
    
    // Notify connected clients about the new resource
    if (socketService.isConnected()) {
      const resource = data.resource;
      
      // Send general resource update
      socketService.sendResourceUpdate(resource._id, {
        action: 'created',
        resource: resource
      });
      
      // Get user details from local storage
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const facultyName = userData.fullName || 'A faculty member';
      
      // If the resource is for a specific semester, emit semester-specific notification
      if (resource.semester && resource.semester > 0) {
        socketService.emitToSemester(resource.semester, 'new-resource-notification', {
          resourceId: resource._id,
          title: resource.title,
          subject: resource.subject,
          facultyName: facultyName,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return data.resource;
  } catch (error) {
    console.error('Failed to create resource:', error);
    throw error;
  }
};

/**
 * Update a resource's statistics (views, downloads, likes, comments)
 */
export const updateResourceStats = async (resourceId: string, action: 'view' | 'download' | 'like' | 'comment', userId?: string) => {
  try {
    console.log('Updating resource stats:', { resourceId, action, userId });
    
    // If in development mode and services not configured, simulate success
    if (process.env.NODE_ENV === 'development' && !s3Config.isConfigured()) {
      console.log('Simulating resource stats update in development mode');
      
      // Return mock success response
      return {
        success: true,
        stats: {
          views: action === 'view' ? 1 : 0,
          downloads: action === 'download' ? 1 : 0,
          likes: action === 'like' ? 1 : 0,
          comments: action === 'comment' ? 1 : 0
        }
      };
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required to update resource stats');
    }
    
    const response = await fetch('/api/resources/stats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ resourceId, action, userId: userId || token })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Notify connected clients about the updated stats
    if (socketService.isConnected()) {
      socketService.sendResourceUpdate(resourceId, {
        action: 'stats-updated',
        stats: data.stats
      });
    }
    
    return data;
  } catch (error) {
    console.error('Failed to update resource stats:', error);
    // Don't throw error for stats updates to avoid disrupting the user experience
    return null;
  }
};

/**
 * Get a single resource by ID
 */
export const getResourceById = async (resourceId: string) => {
  try {
    // If in development mode and services not configured, use mock data
    if (process.env.NODE_ENV === 'development' && !s3Config.isConfigured()) {
      console.log('Using mock resource data for ID:', resourceId);
      return getMockResourceById(resourceId);
    }
    
    // Try to get from cache first if Redis is configured
    if (!redisConfig.useMocks) {
      const cacheKey = `resource:${resourceId}`;
      const cachedResource = await getCache(cacheKey);
      
      if (cachedResource) {
        return cachedResource;
      }
    }
    
    const response = await api.get(API_ROUTES.RESOURCES.GET(resourceId));
    
    // Cache the resource if Redis is configured
    if (!redisConfig.useMocks) {
      const cacheKey = `resource:${resourceId}`;
      await setCache(cacheKey, response.data.resource, 300);
    }
    
    // Join the resource room to receive real-time updates
    if (socketService.isConnected()) {
      socketService.joinResource(resourceId);
    }
    
    return response.data.resource;
  } catch (error) {
    console.error('Failed to get resource:', error);
    
    // Fallback to mock data in case of errors
    if (process.env.NODE_ENV === 'development') {
      console.log('Using mock resource data as fallback for ID:', resourceId);
      return getMockResourceById(resourceId);
    }
    
    throw error;
  }
};

/**
 * Delete a resource by ID
 */
export const deleteResource = async (resourceId: string) => {
  try {
    if (!resourceId || resourceId === 'undefined') {
      throw new Error('Invalid resource ID');
    }
    
    console.log('Deleting resource with ID:', resourceId);
    
    // Get the token from localStorage for authentication
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required to delete resources');
    }
    
    const apiUrl = API_ROUTES.RESOURCES.DELETE(resourceId);
    console.log('Delete URL:', apiUrl);
    
    // Use fetch API for more control over the request
    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Delete resource error response:', errorData);
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    let data;
    try {
      data = await response.json();
    } catch (e) {
      console.log('Response was not JSON, returning simple success object');
      data = { success: true };
    }
    
    console.log('Resource deletion response:', data);
    
    // Clear cache if Redis is configured
    if (!redisConfig.useMocks) {
      await deleteCache(`resource:${resourceId}`);
      await deleteCache('resources:*');
    }
    
    // Notify connected clients about the deletion
    if (socketService.isConnected()) {
      socketService.sendResourceUpdate(resourceId, {
        action: 'deleted',
        resourceId
      });
    }
    
    return data;
  } catch (error) {
    console.error('Failed to delete resource:', error);
    throw error;
  }
};

// Export the checkDatabaseConnection function with proper implementation
export const checkDatabaseConnection = async () => {
  try {
    const response = await api.get('/api/db/status');
    return response.data;
  } catch (error) {
    console.error('Failed to check database connection:', error);
    return {
      connected: false,
      error: 'Failed to connect to the database'
    };
  }
};

export const getResourceAnalytics = async (resourceId: string) => {
  try {
    console.log('Fetching analytics for resource ID:', resourceId);
    
    // Get analytics data from API
    const analyticsUrl = API_ROUTES.RESOURCES.ANALYTICS(resourceId);
    console.log('Analytics URL:', analyticsUrl);
    
    const response = await api.get(analyticsUrl);
    console.log('Analytics response:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('Failed to get resource analytics:', error);
    throw error;
  }
};
