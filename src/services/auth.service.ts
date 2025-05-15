//src\services\auth.service.ts
import api from './api';
import { SignupFormData, UserRole } from '../types/auth';

export const authService = {
  login: async (email: string, password: string) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      return response.data;
    } catch (err: any) {
      console.error('Login failed:', err);
      throw err.response?.data || { message: 'Login failed. Please try again.' };
    }
  },
  
  signup: async (userData: {
    email: string,
    password: string,
    fullName: string,
    role: UserRole,
    department?: string,
    phoneNumber?: string,
    semester?: number,
    secretNumber?: string,
    usn?: string
  }) => {
    try {
      const response = await api.post('/api/auth/signup', userData);
      return response.data;
    } catch (err: any) {
      console.error('Signup failed:', err);
      throw err.response?.data || { message: 'Signup failed. Please try again.' };
    }
  },
  
  logout: async () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return { success: true };
    } catch (err) {
      console.error('Logout failed:', err);
      throw { message: 'Logout failed. Please try again.' };
    }
  },
  me: async () => {
  try {
    const response = await api.get('/api/auth/me');
    return response.data;
  } catch (err: any) {
    console.error('Fetching user failed:', err);
    throw err.response?.data || { message: 'Fetching user failed. Please try again.' };
  }
},
  // Add the missing methods
  verifyEmail: async (token: string) => {
    try {
      const response = await api.post('/api/auth/verify-email', { token });
      return response.data;
    } catch (err: any) {
      console.error('Email verification failed:', err);
      throw err.response?.data || { message: 'Email verification failed. Please try again.' };
    }
  },
  
  verifyOTP: async (email: string, otp: string) => {
    try {
      const response = await api.post('/api/auth/verify-otp', { email, otp });
      return response.data;
    } catch (err: any) {
      console.error('OTP verification failed:', err);
      throw err.response?.data || { message: 'OTP verification failed. Please try again.' };
    }
  },
  
  resendOTP: async (email: string) => {
    try {
      const response = await api.post('/api/auth/send-otp', { email });
      return response.data;
    } catch (err: any) {
      console.error('Resending OTP failed:', err);
      throw err.response?.data || { message: 'Resending OTP failed. Please try again.' };
    }
  }
};
