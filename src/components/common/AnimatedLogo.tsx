
import React, { useEffect, useState } from 'react';
import  Logo  from './Logo'; // Assuming Logo is in the same directory

interface AnimatedLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  refreshKey?: number; // Added to force re-renders
}

export const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ 
  className = '', 
  size = 'md',
  refreshKey = 0
}) => {
  const [forceRender, setForceRender] = useState(0);
  
  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = () => {
      setForceRender(prev => prev + 1);
    };
    
    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`relative ${sizeClasses[size]}`} key={`logo-${refreshKey}-${forceRender}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-full w-full border-4 border-t-indigo-600 border-b-indigo-600 border-l-transparent border-r-transparent"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-indigo-600 font-bold text-2xl">VersatileShare</span>
        </div>
      </div>
    </div>
  );
};
