import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const Header = () => {
  const { user, logout } = useAuth();
  const [profileImage, setProfileImage] = useState<string>('/default-avatar.png');
  
  useEffect(() => {
    if (user?.photoURL) {
      setProfileImage(user.photoURL);
    } else {
      // Set a default image
      setProfileImage('/default-avatar.png');
    }
  }, [user]);
  
  return (
    <header className="bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
          Campus Connect
        </Link>
        
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <div className="flex items-center">
                {profileImage && (
                  <img 
                    src={profileImage} 
                    alt="Profile" 
                    className="h-8 w-8 rounded-full object-cover"
                  />
                )}
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{user.displayName}</span>
              </div>
              <button 
                onClick={logout}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/auth/login" className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
              Login / Sign up
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
