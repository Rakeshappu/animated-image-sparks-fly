
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { AnimatedLogo } from '../common/AnimatedLogo';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { API_ROUTES } from '../../lib/api/routes';

interface PrivateRouteProps {
  children: React.ReactNode;
  role?: 'student' | 'faculty' | 'admin';
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, role }) => {
  const { user, loading } = useAuth();
  const [adminChecked, setAdminChecked] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedLogo />
      </div>
    );
  }

  // Only check admin status once per session to avoid multiple messages
  useEffect(() => {
    if (!loading && user && role === 'admin' && user.role === 'admin' && !adminChecked) {
      setAdminChecked(true);
      
      // Check if we need to store that we've already checked the admin status
      const adminSessionChecked = sessionStorage.getItem('adminSessionChecked');
      if (adminSessionChecked) {
        return; // Already checked in this session
      }
      
      // Verify admin status
      api.get(API_ROUTES.AUTH.ADMIN_CHECK)
        .then(response => {
          console.log('Admin verification successful:', response.data);
          // Mark that we've checked admin status in this session
          sessionStorage.setItem('adminSessionChecked', 'true');
          
          if (response.data.needsRelogin) {
            toast.error('Your admin session is incomplete. Please log out and log back in.', {
              id: 'admin-session-incomplete', // Add ID to prevent duplicate toasts
              duration: 5000
            });
          }
        })
        .catch(error => {
          console.error('Admin verification failed:', error);
          // Mark that we've checked admin status in this session
          sessionStorage.setItem('adminSessionChecked', 'true');
          
          if (error.status === 403) {
            toast.error('Admin privileges could not be verified. Please try logging out and back in.', {
              id: 'admin-verification-failed', // Add ID to prevent duplicate toasts
              duration: 5000
            });
          }
        });
    }
  }, [user, loading, role, adminChecked]);

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
