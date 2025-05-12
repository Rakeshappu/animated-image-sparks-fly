
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { RoleSelection } from './components/RoleSelection.ts';
import { SignupForm } from './components/SignupForm.ts';
import { EmailVerification } from './components/EmailVerification.ts';
import { LoginForm } from './components/LoginForm.ts';
import { AdminApprovalPendingPage } from './AdminApprovalPendingPage.ts';
import { useAuth } from '../../contexts/AuthContext.ts';

export const AuthPage = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (user) {
    // Redirect based on role
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" />;
    } else if (user.role === 'faculty') {
      return <Navigate to="/faculty/dashboard" />;
    } else {
      return <Navigate to="/dashboard" />;
    }
  }

  return (
    <Routes>
      <Route index element={<Navigate to="role" replace />} />
      <Route path="role" element={<RoleSelection />} />
      <Route path="signup" element={<SignupForm />} />
      <Route path="verify" element={<EmailVerification />} />
      <Route path="login" element={<LoginForm />} />
      <Route path="admin-approval-pending" element={<AdminApprovalPendingPage />} />
    </Routes>
  );
};
