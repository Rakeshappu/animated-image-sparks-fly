
import api from './api.js';
import { FacultyResource } from '../types/faculty.js';
import { toast } from 'react-hot-toast';

export const fetchFacultyResources = async (): Promise<FacultyResource[]> => {
  try {
    const response = await api.get('/api/resources/faculty');
    
    // Check if response is HTML instead of JSON
    if (typeof response.data === 'string' && response.data.includes('<!doctype html>')) {
      console.error('Received HTML instead of JSON response');
      toast.error('API returned an incorrect response format. Please check your server configuration.');
      return [];
    }
    
    return response.data.resources || [];
  } catch (error) {
    console.error('Error fetching faculty resources:', error);
    throw error;
  }
};

export const fetchResourceById = async (id: string): Promise<FacultyResource> => {
  try {
    const response = await api.get(`/api/resources/${id}`);
    
    // Check if response is HTML instead of JSON
    if (typeof response.data === 'string' && response.data.includes('<!doctype html>')) {
      console.error('Received HTML instead of JSON response');
      throw new Error('API returned an incorrect response format');
    }
    
    return response.data.resource;
  } catch (error) {
    console.error(`Error fetching resource ${id}:`, error);
    throw error;
  }
};

export const deleteResource = async (id: string): Promise<void> => {
  try {
    await api.delete(`/api/resources/${id}`);
  } catch (error) {
    console.error(`Error deleting resource ${id}:`, error);
    throw error;
  }
};

/**
 * Check the MongoDB database connection status
 * @returns Connection status object
 */
export const checkDatabaseConnection = async () => {
  try {
    // First try the dedicated endpoint
    const response = await api.get('/api/db/status', {
      // Add a timestamp to prevent caching
      params: { _t: new Date().getTime() },
      // Short timeout to prevent hanging
      timeout: 5000
    });
    
    // Check if response is HTML instead of JSON
    if (typeof response.data === 'string' && response.data.includes('<!doctype html>')) {
      console.error('Received HTML instead of JSON for DB status check');
      return {
        connected: false,
        error: 'API returned HTML instead of JSON. Server routing issue detected.',
        message: 'Failed to connect to MongoDB'
      };
    }
    
    return response.data;
  } catch (error:any) {
    console.error('Error checking database connection:', error);
    
    // Return a more detailed error object
    return { 
      connected: false, 
      error: error.message || String(error),
      message: 'Failed to connect to MongoDB'
    };
  }
};

export default checkDatabaseConnection;
