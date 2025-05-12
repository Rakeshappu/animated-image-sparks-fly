
import React from 'react';
import { useAuth } from '../../hooks/useAuth.ts';
import { ProfilePage } from '../profile/ProfilePage.ts';

export const UserProfile = () => {
  const { user } = useAuth();
  
  return <ProfilePage />;
};

export default UserProfile;
