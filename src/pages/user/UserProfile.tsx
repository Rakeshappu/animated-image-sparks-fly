import React from 'react';
import { useAuth } from '../../hooks/useAuth.tsx';
import { ProfilePage } from '../profile/ProfilePage.tsx';

export const UserProfile = () => {
  const { user } = useAuth();
  
  return <ProfilePage />;
};

export default UserProfile;