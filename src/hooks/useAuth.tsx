
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

// Use a simple export syntax to avoid TypeScript issues
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
