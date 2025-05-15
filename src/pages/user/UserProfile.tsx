
import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ProfilePage } from '../profile/ProfilePage';

export const UserProfile = () => {
  const { user } = useAuth();
  
  return <ProfilePage />;
};

export default UserProfile;
