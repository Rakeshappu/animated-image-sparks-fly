
import React from 'react';

interface AnimatedLogoProps {
  className?: string;
}

export const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ className = '' }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative w-16 h-16">
        {/* Replace the src with your actual logo */}
        <img
          src="/your-logo.svg"
          alt="Logo"
          className="w-full h-full object-contain animate-bounce"
        />
      </div>
    </div>
  );
};
