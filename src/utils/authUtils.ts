
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
      
      // Check if we've already warned about this in this session
      const warnedAboutRole = sessionStorage.getItem('warnedAboutRoleMismatch');
      if (warnedAboutRole) {
        return true; // Already warned in this session, don't check again
      }
      
      // Verify with server
      try {
        const response = await api.get('/api/auth/debug-token');
        console.log('Debug token response:', response.data);
        
        if (userData.role === 'admin') {
          // For admin users, suggest re-login if token doesn't have admin role
          sessionStorage.setItem('warnedAboutRoleMismatch', 'true');
          toast.error('Your admin session is incomplete. Please log out and log back in.', {
            id: 'admin-session-incomplete', // Add ID to prevent duplicate toasts
          });
          return false;
        }
      } catch (error) {
        console.error('Failed to verify token with server:', error);
      }
    }
    
    // Check for mismatch between stored user role and token role
    if (tokenPayload && tokenPayload.role && userData.role && tokenPayload.role !== userData.role) {
      console.warn('Token role and user role mismatch:', tokenPayload.role, userData.role);
      
      // Check if we've already warned about this in this session
      const warnedAboutRole = sessionStorage.getItem('warnedAboutRoleMismatch');
      if (warnedAboutRole) {
        return true; // Already warned in this session, don't check again
      }
      
      sessionStorage.setItem('warnedAboutRoleMismatch', 'true');
      toast.error('Please log out and log in again to refresh your permissions.', {
        id: 'role-mismatch', // Add ID to prevent duplicate toasts
      });
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
  // Check if we've already checked in this session
  const reloginChecked = sessionStorage.getItem('reloginChecked');
  if (reloginChecked) {
    return true; // Already checked in this session
  }
  
  const isValid = await validateUserRoleWithToken();
  if (!isValid) {
    sessionStorage.setItem('reloginChecked', 'true');
    toast.error('Please log out and log back in to refresh your session.', {
      id: 'force-relogin', // Add ID to prevent duplicate toasts
    });
    // Optionally, could implement a forced logout here
  }
  return isValid;
};

// Function to ensure admin role is in the token
export const ensureAdminRoleInToken = async () => {
  try {
    // Check if we've already checked admin role in this session
    const adminRoleChecked = sessionStorage.getItem('adminRoleChecked');
    if (adminRoleChecked) {
      return true; // Already checked in this session
    }
    
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
    sessionStorage.setItem('adminRoleChecked', 'true');
    toast.error('Your admin session needs to be refreshed. Please log out and log back in.', {
      id: 'admin-role-missing', // Add ID to prevent duplicate toasts
    });
    return false;
  } catch (e) {
    console.error('Error checking admin role in token:', e);
    return false;
  }
};
