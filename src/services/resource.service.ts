
import api from './api';
import { API_ROUTES } from '../lib/api/routes';

export const getResources = async (params = {}) => {
  try {
    const response = await api.get(API_ROUTES.RESOURCES.LIST, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching resources:', error);
    throw error;
  }
};

export const getResourceById = async (id: string) => {
  try {
    const response = await api.get(`${API_ROUTES.RESOURCES.LIST}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching resource ${id}:`, error);
    throw error;
  }
};

export const createResource = async (resourceData: FormData) => {
  try {
    const response = await api.post(API_ROUTES.RESOURCES.LIST, resourceData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating resource:', error);
    throw error;
  }
};

export const updateResource = async (id: string, resourceData: any) => {
  try {
    const response = await api.put(`${API_ROUTES.RESOURCES.LIST}/${id}`, resourceData);
    return response.data;
  } catch (error) {
    console.error(`Error updating resource ${id}:`, error);
    throw error;
  }
};

export const deleteResource = async (id: string) => {
  try {
    const response = await api.delete(`${API_ROUTES.RESOURCES.LIST}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting resource ${id}:`, error);
    throw error;
  }
};

export const getResourcesBySubject = async (subject: string) => {
  try {
    const response = await api.get(API_ROUTES.RESOURCES.LIST, {
      params: { subject },
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching resources for subject ${subject}:`, error);
    throw error;
  }
};

export const getFacultyResources = async () => {
  try {
    const response = await api.get(API_ROUTES.RESOURCES.FACULTY);
    return response.data;
  } catch (error) {
    console.error('Error fetching faculty resources:', error);
    throw error;
  }
};

export const getPlacementResources = async () => {
  try {
    const response = await api.get(API_ROUTES.RESOURCES.PLACEMENT);
    return response.data;
  } catch (error) {
    console.error('Error fetching placement resources:', error);
    throw error;
  }
};

export const getTrashedResources = async () => {
  try {
    const response = await api.get(API_ROUTES.RESOURCES.TRASH);
    return response.data;
  } catch (error) {
    console.error('Error fetching trashed resources:', error);
    throw error;
  }
};

export const restoreResource = async (id: string) => {
  try {
    const response = await api.post(`${API_ROUTES.RESOURCES.TRASH}/${id}/restore`);
    return response.data;
  } catch (error) {
    console.error(`Error restoring resource ${id}:`, error);
    throw error;
  }
};

export const getResourcesCount = async () => {
  try {
    const response = await api.get(`${API_ROUTES.RESOURCES.LIST}/stats`);
    return response.data;
  } catch (error) {
    console.error('Error fetching resources count:', error);
    throw error;
  }
};
