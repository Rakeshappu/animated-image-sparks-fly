
import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { toast } from 'react-hot-toast';
import { decodeToken } from '../utils/authUtils';

// Create an axios instance with default configs
const api = axios.create({
  baseURL: '/',  // Using relative URLs for development
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 seconds
});

// Request interceptor for adding auth tokens
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      const isAdminRoute = config.url?.includes('/admin/');
      const isAuthAdminRoute = config.url?.includes('/auth/admin-check');
      
      if (isAdminRoute || isAuthAdminRoute) {
        console.log('Admin route detected:', config.url);
        
        // For admin routes, verify token has admin role
        try {
          const payload = decodeToken(token);
          console.log('Token payload for admin request:', payload);
          
          if (!payload?.role || payload.role !== 'admin') {
            console.warn('Token missing admin role for admin route:', config.url);
            // We'll still send the request with the token, but log this warning
            // The server will check the database for admin status as a fallback
          }
        } catch (error) {
          console.error('Error processing token for admin request:', error);
        }
      }
      
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Debug log request
    console.log('API Request:', config.method?.toUpperCase(), config.url, config.data || '');
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Debug log successful response
    console.log('API Response [' + response.status + ']:', response.data);
    return response;
  },
  (error: AxiosError) => {
    // Debug log error response
    const data = error.response?.data;
    const status = error.response?.status;
    const url = error.config?.url;
    const method = error.config?.method;
    
    console.error('API Response Error:', {
      status,
      statusText: error.response?.statusText,
      url,
      method,
      data,
      error: error.message
    });

    // Handle authentication errors
    if (status === 401) {
      console.error('Authentication error:', data);
      // Clear storage on auth errors
      if (url !== '/api/auth/login') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirect to login after a short delay
        setTimeout(() => {
          window.location.href = '/auth/login';
        }, 100);
        
        toast.error('Session expired. Please login again.');
      }
    }
    
    // Special handling for admin permission errors
    if (status === 403) {
      if (url?.includes('/admin/')) {
        console.warn('Admin permission denied:', url);
        
        // Check if user role in localstorage is admin
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const userData = JSON.parse(userStr);
            console.log('Current user role in localStorage:', userData.role);
            
            // If user thinks they're admin but server disagrees
            if (userData.role === 'admin') {
              toast.error((data as any)?.message || 'Your admin session needs to be refreshed. Please log out and log back in.');
            }
          } catch (e) {
            console.error('Error parsing user data:', e);
          }
        }
      }
    }

    // Format error for better handling
    const errorObj: any = new Error(error.message);
    errorObj.status = status;
    errorObj.data = data;
    
    return Promise.reject(errorObj);
  }
);

export default api;
