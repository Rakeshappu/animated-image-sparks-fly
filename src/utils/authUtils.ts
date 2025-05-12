
import { toast } from 'react-hot-toast';
import api from '../services/api';

// Function to decode JWT token and extract payload
export const decodeToken = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(base64));
    return payload;
  } catch (e) {
    console.error('Error decoding token:', e);
    return null;
  }
};

// Function to check if token contains role information
export const tokenHasRole = (token: string): boolean => {
  const payload = decodeToken(token);
  return payload && typeof payload.role === 'string';
};

// Function to check if local user data and token match in terms of role
export const validateUserRoleWithToken = async (): Promise<boolean> => {
  try {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      return false;
    }
    
    const userData = JSON.parse(userStr);
    const tokenPayload = decodeToken(token);
    
    // If token doesn't have role property but user data does
    if (tokenPayload && !tokenPayload.role && userData.role) {
      console.warn('Token missing role information. Consider re-login.');
      
      // Verify with server
      try {
        const response = await api.get('/api/auth/debug-token');
        console.log('Debug token response:', response.data);
        
        if (userData.role === 'admin') {
          // For admin users, suggest re-login if token doesn't have admin role
          toast.error('Your admin session is incomplete. Please log out and log back in.');
          return false;
        }
      } catch (error) {
        console.error('Failed to verify token with server:', error);
      }
    }
    
    // Check for mismatch between stored user role and token role
    if (tokenPayload && tokenPayload.role && userData.role && tokenPayload.role !== userData.role) {
      console.warn('Token role and user role mismatch:', tokenPayload.role, userData.role);
      toast.error('Please log out and log in again to refresh your permissions.');
      return false;
    }
    
    return true;
  } catch (e) {
    console.error('Error validating user role with token:', e);
    return false;
  }
};

// Function to force re-login if issues detected
export const forceReloginIfNeeded = async () => {
  const isValid = await validateUserRoleWithToken();
  if (!isValid) {
    toast.error('Please log out and log back in to refresh your session.');
    // Optionally, could implement a forced logout here
  }
  return isValid;
};

// Function to ensure admin role is in the token
export const ensureAdminRoleInToken = async () => {
  try {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      return false;
    }
    
    const userData = JSON.parse(userStr);
    if (userData.role !== 'admin') {
      return false; // Not an admin user
    }
    
    const tokenPayload = decodeToken(token);
    if (tokenPayload && tokenPayload.role === 'admin') {
      return true; // Token has admin role
    }
    
    // Token doesn't have admin role
    toast.error('Your admin session needs to be refreshed. Please log out and log back in.');
    return false;
  } catch (e) {
    console.error('Error checking admin role in token:', e);
    return false;
  }
};
