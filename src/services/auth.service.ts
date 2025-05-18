
import api from './api';
import toast from 'react-hot-toast';

const authService = {
  login: async (credentials: { email: string; password: string }) => {
    try {
      const response = await api.post('/api/auth/login', credentials);
      
      // Set token and user data with longer expiry
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        // Set token expiry to 30 days
        const expiryTime = new Date();
        expiryTime.setDate(expiryTime.getDate() + 30);
        localStorage.setItem('tokenExpiry', expiryTime.toString());
        
        // Store user data
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
      }
      
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
      localStorage.removeItem('user');
      localStorage.removeItem('tokenExpiry');
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

  resetPassword: async (email: string, code: string, newPassword: string) => {
    try {
      const response = await api.post('/api/auth/reset-password', { 
        email, 
        code, 
        newPassword 
      });
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
  },
  
  // Add the missing OTP verification method
  verifyOTP: async (email: string, otp: string, purpose?: string) => {
    try {
      const response = await api.post('/api/auth/verify-otp', { email, otp, purpose });
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  },
  
  // Add method to resend OTP
  resendOTP: async (email: string) => {
    try {
      const response = await api.post('/api/auth/send-otp', { email });
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  },
  
  // Check if the user is authenticated based on token and expiry
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    const tokenExpiry = localStorage.getItem('tokenExpiry');
    
    if (!token || !tokenExpiry) {
      return false;
    }
    
    // Check if token is expired
    const expiryDate = new Date(tokenExpiry);
    const now = new Date();
    
    return now < expiryDate;
  },
  
  // Get token from localStorage
  getToken: () => {
    return localStorage.getItem('token');
  },
  
  // Refresh token if needed
  refreshTokenIfNeeded: async () => {
    try {
      const token = localStorage.getItem('token');
      const tokenExpiry = localStorage.getItem('tokenExpiry');
      
      if (!token || !tokenExpiry) {
        return false;
      }
      
      const expiryDate = new Date(tokenExpiry);
      const now = new Date();
      
      // If token expires in less than 1 hour, refresh it
      const oneHour = 60 * 60 * 1000;
      if ((expiryDate.getTime() - now.getTime()) < oneHour) {
        console.log('Token will expire soon, refreshing...');
        
        // Call refresh token endpoint
        const response = await api.post('/api/auth/refresh-token', { token });
        
        if (response.data.token) {
          // Update token and expiry
          localStorage.setItem('token', response.data.token);
          const newExpiryTime = new Date();
          newExpiryTime.setDate(newExpiryTime.getDate() + 30);
          localStorage.setItem('tokenExpiry', newExpiryTime.toString());
          
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  }
};

// Make sure we export both as default and named
export { authService };
export default authService;
