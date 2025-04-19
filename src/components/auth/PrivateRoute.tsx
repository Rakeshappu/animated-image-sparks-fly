
import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/auth';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { API_ROUTES } from '../../lib/api/routes';
import { forceReloginIfNeeded } from '../../utils/authUtils';

interface PrivateRouteProps {
  children: React.ReactNode;
  role?: UserRole;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, role }) => {
  const { user, loading } = useAuth();

  // Verify admin access for admin routes
  useEffect(() => {
    if (!loading && user && role === 'admin' && user.role === 'admin') {
      // Verify admin status with the server for extra security
      api.get(API_ROUTES.AUTH.ADMIN_CHECK)
        .then(response => {
          console.log('Admin verification successful:', response.data);
          // Check if server suggests re-login
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

  // Debug logs for authentication check
  console.log('PrivateRoute - Authentication check:', { 
    isLoading: loading, 
    userExists: !!user, 
    userRole: user?.role, 
    requiredRole: role 
  });

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>;
  }

  if (!user) {
    console.log('No authenticated user found, redirecting to login');
    return <Navigate to="/auth/login" />;
  }

  console.log('PrivateRoute - Current user role:', user.role);
  console.log('PrivateRoute - Required role:', role);

  // Admin can access all routes
  if (user.role === 'admin') {
    console.log('User is admin, granting access to route');
    return <>{children}</>;
  }

  // For non-admin users, check role-specific routes
  if (role && user.role !== role) {
    console.log(`Access denied: User is ${user.role} but route requires ${role}`);
    
    // Show toast notification for unauthorized access
    toast.error(`This section requires ${role} access`);
    
    if (user.role === 'faculty') {
      return <Navigate to="/faculty/dashboard" />;
    } else if (user.role === 'student') {
      return <Navigate to="/dashboard" />;
    } else {
      return <Navigate to="/auth/login" />;
    }
  }

  // User has appropriate role, grant access
  console.log('Access granted to route');
  return <>{children}</>;
};

export default PrivateRoute;
