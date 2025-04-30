
import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const sizesClass = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  return (
    <div 
      className={`${sizesClass[size]} bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold ${className}`}
    >
      <span className={size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-xl' : 'text-lg'}>V</span>
    </div>
  );
};

export default Logo;
