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
      // Use the send-otp endpoint with purpose=resetPassword
      const response = await api.post('/api/auth/send-otp', { 
        email, 
        purpose: 'resetPassword' 
      });
      return response.data;
    } catch (error: any) {
      console.error('Forgot password error:', error);
      if (error.response && error.response.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to process password reset request');
    }
  },

  resetPassword: async (email: string, code: string, newPassword: string) => {
    try {
      console.log('Resetting password for:', email);
      // Use fetch directly to avoid CORS issues
      const baseURL = import.meta.env.MODE === 'development' 
        ? 'http://localhost:3000' 
        : window.location.origin;
      
      const response = await fetch(`${baseURL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code, newPassword }),
        credentials: 'omit' // Don't include credentials for this request
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network response was not ok' }));
        console.error('Password reset failed:', errorData);
        throw new Error(errorData.error || 'Failed to reset password');
      }
      
      const data = await response.json();
      console.log('Password reset successful:', data);
      return data;
    } catch (error: any) {
      console.error('Reset password error:', error);
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
  
  // Update the OTP verification method to properly handle purpose
  verifyOTP: async (email: string, otp: string, purpose?: string) => {
    try {
      console.log('Verifying OTP:', { email, otp, purpose });
      
      // Make a direct fetch call to avoid CORS issues
      const baseURL = import.meta.env.MODE === 'development' 
        ? 'http://localhost:3000' 
        : window.location.origin;
        
      const response = await fetch(`${baseURL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp, purpose }),
        credentials: 'omit' // Don't include credentials for this request
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network response was not ok' }));
        throw new Error(errorData.error || 'Failed to verify OTP');
      }
      
      const data = await response.json();
      console.log('OTP verification response:', data);
      return data;
    } catch (error: any) {
      console.error('OTP verification error:', error);
      if (error.response && error.response.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Invalid or expired OTP');
    }
  },
  
  // Update resend OTP method to ensure it works correctly with purpose parameter
  resendOTP: async (email: string, purpose?: string) => {
    try {
      // Update to use send-otp endpoint with purpose parameter
      console.log('Resending OTP for', email, 'with purpose:', purpose);
      const response = await api.post('/api/auth/send-otp', { email, purpose });
      return response.data;
    } catch (error: any) {
      console.error('Resend OTP error:', error);
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
