
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';
import { toast } from 'react-hot-toast';

interface User {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  isAdminVerified: boolean;
  profilePicture?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  registerUser: (userData: any) => Promise<any>;
  setError: (message: string | null) => void;
  clearError: () => void;
  verifyEmail: (token: string) => Promise<any>;
  verifyOTP: (email: string, otp: string) => Promise<any>;
  resendVerification: (email: string) => Promise<any>;
  updateUserProfile: (userData: Partial<User>) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if token exists and is valid
        if (authService.isAuthenticated()) {
          // Get user data from localStorage for now
          // In a real app, you might want to verify the token on the server
          const userStr = localStorage.getItem('user');
          if (userStr) {
            setUser(JSON.parse(userStr));
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await authService.login({ email, password });
      setUser(response.user);
      setError(null);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    navigate('/auth/login');
  };

  const registerUser = async (userData: any) => {
    setLoading(true);
    try {
      const response = await authService.register(userData);
      setError(null);
      return response;
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to register');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const verifyEmail = async (token: string) => {
    setLoading(true);
    try {
      const response = await authService.verifyEmail(token);
      setError(null);
      return response;
    } catch (err: any) {
      console.error('Email verification error:', err);
      setError(err.message || 'Failed to verify email');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (email: string, otp: string) => {
    setLoading(true);
    try {
      const response = await authService.verifyOTP(email, otp);
      setError(null);
      return response;
    } catch (err: any) {
      console.error('OTP verification error:', err);
      setError(err.message || 'Failed to verify OTP');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async (email: string) => {
    setLoading(true);
    try {
      const response = await authService.resendOTP(email);
      setError(null);
      return response;
    } catch (err: any) {
      console.error('Resend verification error:', err);
      setError(err.message || 'Failed to resend verification email');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        registerUser,
        setError,
        clearError,
        verifyEmail,
        verifyOTP,
        resendVerification,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
