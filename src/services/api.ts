
import axios from 'axios';
import { toast } from 'react-hot-toast';
// Fix the invalid import by using a named import from react-router-dom
import { useNavigate } from 'react-router-dom';

// Create axios instance
const api = axios.create({
  baseURL: '/', // Base URL for all API requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for API calls
api.interceptors.request.use(
  (config) => {
    // Get the token from localStorage
    const token = localStorage.getItem('token');
    
    // If token exists, add it to the authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      
      // Log admin-specific requests for debugging
      if (config.url && config.url.includes('/admin/')) {
        console.log('Admin request detected:', config.url, 'Adding token header');
      }
    }
    
    // For admin routes, ensure the correct content-type and additional headers if needed
    if (config.url && config.url.includes('/admin/')) {
      console.log('Setting up admin request headers for:', config.url);
      
      // For user verification endpoint specifically:
      if (config.url.includes('/admin/users/verify')) {
        console.log('Special handling for admin verify user request');
        // Make sure we're not overriding if it's multipart/form-data
        if (config.headers['Content-Type'] !== 'multipart/form-data') {
          config.headers['Content-Type'] = 'application/json';
        }
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => {
    // Return the successful response
    return response;
  },
  (error) => {
    // Handle error responses
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls outside of the range of 2xx
      if (error.response.status === 401) {
        // Handle unauthorized access (e.g., token expired)
        console.error('Authentication failed:', error.response.data);
        
        // Check if we're already on the login page to avoid redirect loops
        if (window.location.pathname !== '/auth/login') {
          toast.error('Your session has expired. Please log in again.');
          
          // Clear auth data
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('tokenExpiry');
          
          // Redirect to login
          window.location.href = '/auth/login';
        }
      } else if (error.response.status === 403) {
        // Handle forbidden access (e.g., insufficient permissions)
        console.error('Permission denied:', error.response.data);

        if (error.config.url.includes('/admin/')) {
          // Special handling for admin routes
          console.log('Admin permission denied:', error.config.url);
          toast.error('Admin access required for this operation. Please log out and log back in to refresh your session.');
          
          // Get user details from localStorage
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const userData = JSON.parse(userStr);
            if (userData.role === 'admin') {
              // If user is supposed to be admin but getting 403, suggest refreshing token
              toast.error('Your admin session may need refreshing. Please log out and log back in.');
            }
          }
        }
      } else if (error.response.status === 404) {
        // Handle not found
        console.error('Resource not found:', error.response.data);
      } else if (error.response.status === 500) {
        // Handle server errors
        console.error('Server error:', error.response.data);
        toast.error('Something went wrong. Please try again later.');
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
      toast.error('Server not responding. Please try again later.');
    } else {
      // Something happened in setting up the request
      console.error('Request error:', error.message);
      toast.error('Error connecting to server');
    }

    // Return the error for further handling if needed
    return Promise.reject(error);
  }
);

export default api;
