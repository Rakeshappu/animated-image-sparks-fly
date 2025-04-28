
import api from './api';
import toast from 'react-hot-toast';

const authService = {
  login: async (credentials: { email: string; password: string }) => {
    try {
      const response = await api.post('/api/auth/login', credentials);
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        if (error.response.data?.error) {
          throw new Error(error.response.data.error);
        } else {
          throw new Error('Incorrect email or password. Please try again.');
        }
      }
      throw error;
    }
  },

  register: async (userData: any) => {
    try {
      const response = await api.post('/api/auth/register', userData);
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  },

  logout: async () => {
    try {
      // You might want to invalidate the token on the server side
      // For now, we'll just remove the token from local storage
      localStorage.removeItem('token');
      return true;
    } catch (error) {
      console.error('Logout failed:', error);
      return false;
    }
  },

  forgotPassword: async (email: string) => {
    try {
      const response = await api.post('/api/auth/forgot-password', { email });
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  },

  resetPassword: async (token: string, newPassword: string) => {
    try {
      const response = await api.post(`/api/auth/reset-password/${token}`, { newPassword });
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  },

  verifyEmail: async (token: string) => {
    try {
      const response = await api.get(`/api/auth/verify-email/${token}`);
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  }
};

// Make sure we export both as default and named
export { authService };
export default authService;
