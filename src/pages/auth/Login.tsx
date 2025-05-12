
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../../components/auth/LoginForm.ts';
import { MongoDBStatusBanner } from '../../components/auth/MongoDBStatusBanner.ts';
import { authService } from '../../services/auth.service.ts';
import { LoginFormData } from '../../types/auth.ts';
import checkDatabaseConnection  from '../../services/resource.service.ts';
import { useAuth } from '../../contexts/AuthContext.ts';
import { toast } from 'react-hot-toast';
import { decodeToken } from '../../utils/authUtils.ts';

export const Login = () => {
  const { login, clearError } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const navigate = useNavigate();

  // Check MongoDB connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const status = await checkDatabaseConnection();
        setDbStatus(status);
        console.log('MongoDB connection status:', status);
      } catch (err) {
        console.error('Failed to check DB connection:', err);
      }
    };
    
    checkConnection();
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
          toast.warning('Admin session may be incomplete. Please log out and log back in if you encounter permission issues.');
        }
      }
      
      console.log('Login successful, navigating to dashboard...');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <>
      <MongoDBStatusBanner status={dbStatus} />
      <LoginForm onSubmit={handleLogin} error={error} />
    </>
  );
};

export default Login;
