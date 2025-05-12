import React from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { ProfilePage } from '../profile/ProfilePage.js';

export const UserProfile = () => {
  const { user } = useAuth();
  
  return <ProfilePage />;
};

export default UserProfile;