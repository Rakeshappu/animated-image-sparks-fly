
import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import { API_ROUTES } from '../lib/api/routes';
import { User, UserRole } from '../types/auth';
import { toast } from 'react-hot-toast';
import { decodeToken } from '../utils/authUtils';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (userData: SignupData) => Promise<void>;
  updateUser: (updatedData: Partial<User>) => void;
  error: string | null;
  clearError: () => void;
  isAuthenticated: boolean;
  verifyOTP?: (email: string, otp: string) => Promise<any>;
  resendOTP?: (email: string) => Promise<any>;
}

interface SignupData {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  usn?: string;
  department?: string;
  semester?: number;
  phoneNumber?: string;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user data exists in localStorage
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        
        // Decode token to verify role information
        const decodedToken = decodeToken(storedToken);
        const tokenRole = decodedToken?.role;
        
        // If token doesn't have role but local storage does, show warning
        if (userData.role && !tokenRole) {
          console.warn('Token missing role information. Consider re-login.');
          toast.error('Your session may need refreshing. Consider logging out and back in.', {
            duration: 6000
          });
        }
        
        setUser(userData);
        
        // Verify token with server
        api.get(API_ROUTES.AUTH.ME)
          .then(response => {
            const serverUserData = response.data.user;
            // Update with latest user data from server
            if (serverUserData) {
              const updatedUser = {
                ...userData,
                ...serverUserData, // Override with server data for any fields that exist there
                role: serverUserData.role || userData.role,
                isVerified: serverUserData.isVerified || userData.isVerified,
                avatar: serverUserData.avatar || userData.avatar
              };
              
              localStorage.setItem('user', JSON.stringify(updatedUser));
              setUser(updatedUser);
            }
          })
          .catch(error => {
            console.error('Error verifying token:', error);
            // Token might be invalid, clear storage
            if (error.status === 401) {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              setUser(null);
            }
          });
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('user');
      }
    }
    
    setLoading(false);
  }, []);

  const clearError = () => {
    setError(null);
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const response = await api.post(API_ROUTES.AUTH.LOGIN, { email, password });
      
      const { token, user } = response.data;
      
      // Store token and user data in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Verify token has role information
      const decodedToken = decodeToken(token);
      if (!decodedToken?.role && user?.role) {
        console.warn('Token does not contain role information but user data does.');
        // We'll continue but log this warning
      }
      
      setUser(user);
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed. Please try again.';
      setError(errorMessage);
      throw err;
    }
  };

  const logout = async () => {
    try {
      // Remove token and user data from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Clear user state
      setUser(null);
      setError(null);
      
      // Optionally notify the server (if you have a logout endpoint)
      // await api.post(API_ROUTES.AUTH.LOGOUT);
      
      return Promise.resolve();
    } catch (error) {
      console.error('Logout error:', error);
      return Promise.reject(error);
    }
  };

  const signup = async (userData: SignupData) => {
    try {
      setError(null);
      const response = await api.post(API_ROUTES.AUTH.SIGNUP, userData);
      
      const { token, user } = response.data;
      
      // Store token and user data in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setUser(user);
    } catch (err: any) {
      const errorMessage = err.message || 'Signup failed. Please try again.';
      setError(errorMessage);
      throw err;
    }
  };

  const updateUser = (updatedData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updatedData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Dispatch a custom event to notify other components about the update
      const event = new CustomEvent('profileUpdated', { 
        detail: updatedData 
      });
      window.dispatchEvent(event);
      
      // If the avatar is updated, add a timestamp to force refresh across components
      if (updatedData.avatar) {
        // Clean URL from any existing timestamps
        let cleanAvatarUrl = updatedData.avatar;
        if (cleanAvatarUrl.includes('?t=')) {
          cleanAvatarUrl = cleanAvatarUrl.split('?t=')[0];
        }
        
        // Update with new timestamp
        const avatarWithTimestamp = `${cleanAvatarUrl}?t=${Date.now()}`;
        const userWithUpdatedAvatar = { ...updatedUser, avatar: avatarWithTimestamp };
        
        // Update state and localStorage with the timestamped avatar
        setUser(userWithUpdatedAvatar);
        localStorage.setItem('user', JSON.stringify(userWithUpdatedAvatar));
      }
    }
  };
  
  // Add OTP verification methods to support the OtpVerification component
  const verifyOTP = async (email: string, otp: string) => {
    try {
      const response = await api.post(API_ROUTES.AUTH.VERIFY_OTP, { email, otp });
      return response.data;
    } catch (err: any) {
      const errorMessage = err.message || 'OTP verification failed. Please try again.';
      setError(errorMessage);
      throw err;
    }
  };

  const resendOTP = async (email: string) => {
    try {
      const response = await api.post(API_ROUTES.AUTH.SEND_OTP, { email });
      return response.data;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to resend OTP. Please try again.';
      setError(errorMessage);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      logout, 
      signup, 
      updateUser, 
      error, 
      clearError,
      isAuthenticated: !!user,
      verifyOTP,
      resendOTP,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
