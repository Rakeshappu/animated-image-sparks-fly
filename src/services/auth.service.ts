import api from './api.ts';
import { UserRole } from '../types/auth.ts';

// Auth Service with forgot password functionality
export const authService = {
  // Login with email and password
  async login(email: string, password: string) {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  },
  
  // Register a new user
  async signup(userData: {
    email: string;
    password: string;
    fullName: string;
    role: UserRole;
    department?: string;
    phoneNumber?: string;
    semester?: number;
    secretNumber?: string;
    usn?: string;
  }) {
    const response = await api.post('/api/auth/signup', userData);
    return response.data;
  },
  
  // Verify email with token and OTP
  async verifyEmail(token: string, otp: string) {
    const response = await api.post('/api/auth/verify-email', { token, otp });
    return response.data;
  },
  
  // Resend verification email
  async resendVerification(email: string) {
    const response = await api.post('/api/auth/resend-verification', { email });
    return response.data;
  },
  
  // Reset password request (forgot password)
  async forgotPassword(email: string) {
    const response = await api.post('/api/auth/forgot-password', { email });
    return response.data;
  },
  
  // Reset password with token and new password
  async resetPassword(token: string, otp: string, newPassword: string) {
    const response = await api.post('/api/auth/reset-password', {
      token,
      otp,
      newPassword
    });
    return response.data;
  },
  
  // Get current user
  async getCurrentUser() {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
  
  // Logout (clear token from storage)
  async logout() {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
  }
};

export default authService;