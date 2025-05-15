//src\components\auth\PrivateRoute.tsx
import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AnimatedLogo } from '../common/AnimatedLogo';
import { UserRole } from '../../types/auth';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { API_ROUTES } from '../../lib/api/routes';
import { forceReloginIfNeeded } from '../../utils/authUtils';

interface PrivateRouteProps {
  children: React.ReactNode;
  role?: 'student' | 'faculty' | 'admin';
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, role }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedLogo />
      </div>
    );
  }

  useEffect(() => {
    if (!loading && user && role === 'admin' && user.role === 'admin') {
      api.get(API_ROUTES.AUTH.ADMIN_CHECK)
        .then(response => {
          console.log('Admin verification successful:', response.data);
          if (response.data.needsRelogin) {
            toast.error('Your admin session is incomplete. Please log out and log back in.');
          }
        })
        .catch(error => {
          console.error('Admin verification failed:', error);
          if (error.status === 403) {
            toast.error('Admin privileges could not be verified. Please try logging out and back in.');
            forceReloginIfNeeded();
          }
        });
    }
  }, [user, loading, role]);

  console.log('PrivateRoute - Authentication check:', { 
    isLoading: loading, 
    userExists: !!user, 
    userRole: user?.role, 
    requiredRole: role 
  });

  if (!user) {
    console.log('No authenticated user found, redirecting to login');
    return <Navigate to="/auth/login" />;
  }

  console.log('PrivateRoute - Current user role:', user.role);
  console.log('PrivateRoute - Required role:', role);

  if (user.role === 'admin') {
    console.log('User is admin, granting access to route');
    return <>{children}</>;
  }

  if (role && user.role !== role) {
    console.log(`Access denied: User is ${user.role} but route requires ${role}`);
    
    toast.error(`This section requires ${role} access`);
    
    if (user.role === 'faculty') {
      return <Navigate to="/faculty/dashboard" />;
    } else if (user.role === 'student') {
      return <Navigate to="/dashboard" />;
    } else {
      return <Navigate to="/auth/login" />;
    }
  }

  console.log('Access granted to route');
  return <>{children}</>;
};

export default PrivateRoute;
