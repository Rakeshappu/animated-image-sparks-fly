
import api from './api';
import { toast } from 'react-hot-toast';

// Fetch study materials for students based on semester
export const fetchStudyMaterials = async (semesterId?: number | null) => {
  try {
    let endpoint = '/api/resources';
    
    if (semesterId) {
      endpoint += `?semester=${semesterId}`;
    }
    
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error('Error fetching study materials:', error);
    toast.error('Failed to load study materials');
    throw error;
  }
};

// Create a new resource
export const createResource = async (formData: FormData) => {
  try {
    const response = await api.post('/api/resources', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.resource;
  } catch (error) {
    console.error('Error creating resource:', error);
    toast.error('Failed to create resource');
    throw error;
  }
};

// Delete a resource
export const deleteResource = async (resourceId: string) => {
  try {
    const response = await api.delete(`/api/resources/${resourceId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting resource:', error);
    toast.error('Failed to delete resource');
    throw error;
  }
};

// Check database connection status
export const checkDatabaseConnection = async () => {
  try {
    const response = await api.get('/api/db/status');
    return response.data;
  } catch (error) {
    console.error('Error checking database connection:', error);
    return { connected: false, error: (error as Error).message };
  }
};
export const getResources = async (params: {
  page?: number;
  limit?: number;
  type?: string;
  semester?: number;
  search?: string;
  sortOrder?: 'asc' | 'desc';
}) => {
  try {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.type) query.append('type', params.type);
    if (params.semester) query.append('semester', params.semester.toString());
    if (params.search) query.append('search', params.search);
    if (params.sortOrder) query.append('sortOrder', params.sortOrder);

    const endpoint = `/api/resources?${query.toString()}`;
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error('Error fetching resources:', error);
    toast.error('Failed to fetch resources');
    throw error;
  }
};

// Export a default object with all methods for easier imports
const resourceService = {
  fetchStudyMaterials,
  createResource,
  deleteResource,
  checkDatabaseConnection,
  getResources,
};



export default resourceService;