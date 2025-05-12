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

export const getResourceById = async (id) => {
  try {
    const response = await api.get(`${API_ROUTES.RESOURCES.LIST}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching resource ${id}:`, error);
    throw error;
  }
};

export const createResource = async (resourceData) => {
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

export const updateResource = async (id, resourceData) => {
  try {
    const response = await api.put(`${API_ROUTES.RESOURCES.LIST}/${id}`, resourceData);
    return response.data;
  } catch (error) {
    console.error(`Error updating resource ${id}:`, error);
    throw error;
  }
};

export const deleteResource = async (id) => {
  try {
    const response = await api.delete(`${API_ROUTES.RESOURCES.LIST}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting resource ${id}:`, error);
    throw error;
  }
};

export default createResource;
