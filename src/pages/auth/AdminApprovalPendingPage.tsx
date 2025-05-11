
import React from 'react';
import { useLocation } from 'react-router-dom';
import { AdminApprovalPending } from '../../components/auth/AdminApprovalPending';

export const AdminApprovalPendingPage = () => {
  const location = useLocation();
  const email = location.state?.email || '';

  return <AdminApprovalPending email={email} />;
};
