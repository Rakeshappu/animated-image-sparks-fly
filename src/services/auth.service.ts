
import api from './api';
import { API_ROUTES } from '../lib/api/routes';
import { SignupFormData, LoginFormData, User } from '../types/auth';
import { decodeToken } from '../utils/authUtils';
import { toast } from 'react-hot-toast';

const handleApiError = (error: any, defaultMessage: string) => {
  console.error('API Error Details:', {
    message: error.message,
    response: error.response?.data,
    status: error.response?.status
  });
  
  const errorMessage = error.response?.data?.error || 
                      error.response?.data?.message ||
                      error.message ||
                      defaultMessage;
  throw new Error(errorMessage);
};

export const authService = {
  async verifyToken(): Promise<{ user: User }> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No auth token found');
      }
      
      const response = await api.get(API_ROUTES.AUTH.ME);
      
      // Check token for role information
      const tokenPayload = decodeToken(token);
      const userData = response.data.user;
      
      if (userData && userData.role && (!tokenPayload.role || tokenPayload.role !== userData.role)) {
        console.warn('Token role information mismatch or missing:', {
          tokenRole: tokenPayload.role || 'missing',
          userRole: userData.role
        });
        
        // For admin users, this is more critical
        if (userData.role === 'admin') {
          toast.warning('Your admin permissions may not be fully activated in this session. Consider logging out and back in.');
        }
      }
      
      return response.data;
    } catch (error: any) {
      localStorage.removeItem('token'); // Clear invalid token
      localStorage.removeItem('user'); // Clear stored user too
      throw error;
    }
  },
  
  async login(data: LoginFormData) {
    try {
      console.log('Attempting login with:', data);
      const response = await api.post(API_ROUTES.AUTH.LOGIN, data);
      console.log('Login response:', response.data);
      
      if (response.data.token) {
        const token = response.data.token;
        const user = response.data.user;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Verify token contains proper role information
        const tokenPayload = decodeToken(token);
        if (!tokenPayload.role || tokenPayload.role !== user.role) {
          console.warn('Token role missing or mismatch:', {
            tokenRole: tokenPayload.role || 'missing',
            userRole: user.role
          });
          
          if (user.role === 'admin') {
            toast.warning('Your admin session may require refreshing if you encounter permission issues.');
          }
        }
      }
      return response.data;
    } catch (error: any) {
      handleApiError(error, 'Invalid email or password');
    }
  },

  async signup(data: SignupFormData){
    try {
      console.log('Sending signup request:', data);
      // Make sure USN is included in the request if the role is student
      if (data.role === 'student' && !data.usn) {
        throw new Error('USN is required for student registration');
      }
      // Use correct API endpoint from API_ROUTES
      const response = await api.post(API_ROUTES.AUTH.SIGNUP, data);
      console.log('Signup response:', response.data);
      return response.data;
    } catch (error: any) {
      handleApiError(error, 'Failed to create account');
    }
  },

  async verifyEmail(token: string){
    try {
      const response = await api.post(API_ROUTES.AUTH.VERIFY_EMAIL, { token });
      return response.data;
    } catch (error: any) {
      handleApiError(error, 'Email verification failed');
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        // Use stored user data for quick rendering
        const user = JSON.parse(storedUser);
        
        // Verify token has required role information
        const tokenPayload = decodeToken(token);
        if (user.role === 'admin' && (!tokenPayload.role || tokenPayload.role !== 'admin')) {
          console.warn('Token missing admin role information for admin user');
          toast.warning('Your admin permissions may not be fully activated. Consider logging out and back in.');
        }
        
        // Verify with server in background
        api.get(API_ROUTES.AUTH.ME)
          .then(response => {
            // Update stored user if different
            const freshUser = response.data.user;
            if (JSON.stringify(freshUser) !== storedUser) {
              localStorage.setItem('user', JSON.stringify(freshUser));
            }
          })
          .catch(err => {
            console.error('User verification failed:', err);
            // If verification fails, clear storage
            if (err.status === 401) {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.href = '/auth/login';
            }
          });
        
        return user;
      }
      
      // No stored user, fetch from server
      const response = await api.get(API_ROUTES.AUTH.ME);
      const user = response.data.user;
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return null;
    }
  },

  async verifyOTP(email: string, otp: string) {
    try {
      console.log('Sending OTP verification request:', { email, otp });
      const response = await api.post(API_ROUTES.AUTH.VERIFY_OTP, { email, otp });
      console.log('OTP verification response:', response.data);
      return response.data;
    } catch (error: any) {
      console.log('OTP verification error details:', {
        response: error.response?.data,
        status: error.response?.status,
        message: error.message
      });
      handleApiError(error, 'OTP verification failed');
    }
  },

  async resendOTP(email: string) {
    try {
      const response = await api.post(API_ROUTES.AUTH.SEND_OTP, { email });
      return response.data;
    } catch (error: any) {
      handleApiError(error, 'Failed to resend OTP');
    }
  },

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/auth/login';
  },
  
  async resendVerification(email: string) {
    try {
      const response = await api.post(API_ROUTES.AUTH.RESEND_VERIFICATION, { email });
      return response.data;
    } catch (error: any) {
      handleApiError(error, 'Failed to resend verification email');
    }
  },
  
  async googleLogin(token: string) {
    try {
      const response = await api.post(API_ROUTES.AUTH.GOOGLE, { token });
      
      // If the user needs to provide additional info
      if (response.status === 202) {
        return {
          needsAdditionalInfo: true,
          ...response.data
        };
      }
      
      // Normal login success
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error: any) {
      handleApiError(error, 'Google authentication failed');
    }
  },
  
  async verifyAdminStatus() {
    try {
      const response = await api.get(API_ROUTES.AUTH.ADMIN_CHECK);
      
      // Check if admin verification suggests relogin
      if (response.data.needsRelogin) {
        toast.warning('Your admin session needs to be refreshed. Please log out and log back in.');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Admin verification failed:', error);
      
      // If we get a 403 but user thinks they're admin, suggest relogin
      if (error.status === 403) {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const userData = JSON.parse(userStr);
            if (userData.role === 'admin') {
              toast.error('Your admin session needs to be refreshed. Please log out and log back in.');
            }
          } catch (e) {
            console.error('Error parsing user data:', e);
          }
        }
      }
      
      return null;
    }
  }
};
