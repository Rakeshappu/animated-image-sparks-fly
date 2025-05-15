import axios from 'axios';
import { API_ROUTES } from '../lib/api/routes';
import { InternalAxiosRequestConfig } from 'axios';

// Create Axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Request interceptor for adding token to request headers
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Log API requests in development
    const url = config.url || '';
    console.log(`API ${config.method?.toUpperCase()} request to: ${config.baseURL}${url}`);
    
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // If token exists, add it to the Authorization header
    if (token && config.headers && typeof config.headers.set === 'function') {
  config.headers.set('Authorization', `Bearer ${token}`);
}
    
    // Fix double slashes in URL
    if (config.url && config.baseURL && config.url.startsWith('/') && config.baseURL.endsWith('/')) {
      config.url = config.url.substring(1);
    }
    
    return config;
  },
  (error) => {
    console.error('API request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common API errors
    if (error.response) {
      if (error.response.status === 401) {
        console.error('Unauthorized access:', error.response.data);
        
        // Don't log user out if they're trying to log in
        const isAuthEndpoint = error.config.url && (
          error.config.url.includes(API_ROUTES.AUTH.LOGIN) ||
          error.config.url.includes(API_ROUTES.AUTH.SIGNUP) ||
          error.config.url.includes(API_ROUTES.AUTH.ME)
        );
        
        if (!isAuthEndpoint) {
          // Clear token and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // Only redirect if in browser environment
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
      } else if (error.response.status === 404) {
        console.log('Resource not found:', error.response.data);
      } else {
        console.error('API error response:', error.response.data);
      }
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;