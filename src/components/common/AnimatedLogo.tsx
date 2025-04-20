
import React from 'react';

interface AnimatedLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ 
  className = '', 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`relative ${sizeClasses[size]}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-full w-full border-4 border-t-indigo-600 border-b-indigo-600 border-l-transparent border-r-transparent"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-indigo-600 font-bold text-2xl">V</span>
        </div>
      </div>
    </div>
  );
};
