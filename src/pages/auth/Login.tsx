import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../../components/auth/LoginForm';
import { MongoDBStatusBanner } from '../../components/auth/MongoDBStatusBanner';
import { authService } from '../../services/auth.service';
import { LoginFormData } from '../../types/auth';
import { checkDatabaseConnection } from '../../services/resource.service';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { decodeToken } from '../../utils/authUtils';

export const Login = () => {
  const { login, clearError } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [isCheckingDB, setIsCheckingDB] = useState<boolean>(true);
  const navigate = useNavigate();

  // Check MongoDB connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      setIsCheckingDB(true);
      try {
        const status = await checkDatabaseConnection();
        setDbStatus(status);
        console.log('MongoDB connection status:', status);
        
        // If we got HTML instead of a proper status object, it means API routing is failing
        if (typeof status === 'string' && status.includes('<!doctype html>')) {
          setDbStatus({
            connected: false,
            error: 'API routing error: Received HTML instead of JSON. Check server configuration.',
            message: 'Failed to connect to MongoDB'
          });
        }
      } catch (err) {
        console.error('Failed to check DB connection:', err);
        setDbStatus({
          connected: false,
          error: err instanceof Error ? err.message : 'Unknown error checking database connection',
          message: 'Failed to connect to MongoDB'
        });
      } finally {
        setIsCheckingDB(false);
      }
    };
    
    checkConnection();
    
    // Re-check connection every 60 seconds
    const intervalId = setInterval(checkConnection, 60000);
    
    return () => clearInterval(intervalId);
  }, []);

  const handleLogin = async (formData: LoginFormData) => {
    try {
      if (clearError) {
        clearError();
      }
      
      console.log('Login attempt with:', formData);
      
      // Show warning if MongoDB is not connected
      if (dbStatus && !dbStatus.connected) {
        console.warn('MongoDB is not connected. Using fallback authentication.');
        toast.error('Database connection issue. Login will work but data may not be saved.');
      }
      
      await login(formData.email, formData.password);
      
      // Verify token has necessary information
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (token && userStr) {
        const userData = JSON.parse(userStr);
        const tokenData = decodeToken(token);
        
        // For admin users, verify the token contains role information
        if (userData.role === 'admin' && (!tokenData.role || tokenData.role !== 'admin')) {
          console.warn('Admin login but token missing role information.', tokenData);
          toast.error('Admin session may be incomplete. Please log out and log back in if you encounter permission issues.');
        }
        
        // Log token role info for debugging
        console.log('Token role information:', tokenData.role || 'No role in token');
        console.log('User role from localStorage:', userData.role);
        
        if (tokenData.role !== userData.role) {
          console.warn('Token does not contain correct role information.');
        }
      }
      
      console.log('Login successful, navigating to dashboard...');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
      toast.error(err instanceof Error ? err.message : 'Login failed');
    }
  };

  const refreshDBStatus = async () => {
    setIsCheckingDB(true);
    try {
      const status = await checkDatabaseConnection();
      setDbStatus(status);
      toast.success('Connection status refreshed');
    } catch (err) {
      console.error('Failed to refresh DB status:', err);
      toast.error('Failed to refresh connection status');
    } finally {
      setIsCheckingDB(false);
    }
  };

  return (
    <>
      <MongoDBStatusBanner status={dbStatus} onRefresh={refreshDBStatus} />
      <LoginForm onSubmit={handleLogin} error={error} />
    </>
  );
};

export default Login;