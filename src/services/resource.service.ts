import api from './api.js';
import { FacultyResource } from '../types/faculty.js';

export const fetchFacultyResources = async (): Promise<FacultyResource[]> => {
  try {
    const response = await api.get('/api/resources/faculty');
    return response.data.resources;
  } catch (error) {
    console.error('Error fetching faculty resources:', error);
    throw error;
  }
};

export const fetchResourceById = async (id: string): Promise<FacultyResource> => {
  try {
    const response = await api.get(`/api/resources/${id}`);
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

export const checkDatabaseConnection = async () => {
  try {
    const response = await api.get('/api/db/status');
    return response.data;
  } catch (error:any) {
    console.error('Error checking database connection:', error);
    return { connected: false, error: error.message };
  }
};

export default checkDatabaseConnection;