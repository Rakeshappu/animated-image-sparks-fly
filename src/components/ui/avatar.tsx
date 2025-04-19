
import React from 'react';

interface AvatarProps {
  className?: string;
  src?: string;
  alt?: string;
  children?: React.ReactNode;
}

export const Avatar = ({ className = '', src, alt, children }: AvatarProps) => (
  <div className={`relative h-10 w-10 overflow-hidden rounded-full ${className}`}>
    {src ? (
      <img
        src={src}
        alt={alt || "Avatar"}
        className="h-full w-full object-cover"
      />
    ) : (
      children
    )}
  </div>
);

export const AvatarImage = ({ src, alt, className = '' }: { src: string, alt?: string, className?: string }) => (
  <img
    src={src}
    alt={alt || "Avatar"}
    className={`h-full w-full object-cover ${className}`}
  />
);

export const AvatarFallback = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`flex h-full w-full items-center justify-center bg-gray-200 text-gray-700 font-medium ${className}`}>
    {children}
  </div>
);
