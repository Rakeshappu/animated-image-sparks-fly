
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className = '', 
    variant = 'default', 
    size = 'md', 
    children, 
    asChild = false, 
    ...props 
  }, ref) => {
    
    const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none";
    
    const variantClasses = {
      default: "bg-gray-900 text-white hover:bg-gray-800",
      primary: "bg-blue-600 text-white hover:bg-blue-700",
      outline: "border border-gray-300 bg-transparent hover:bg-gray-50",
      ghost: "bg-transparent hover:bg-gray-100",
      link: "bg-transparent text-blue-600 underline-offset-4 hover:underline",
    };

    const sizeClasses = {
      sm: "text-xs px-3 py-1",
      md: "text-sm px-4 py-2",
      lg: "text-base px-6 py-3",
    };

    const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

    if (asChild) {
      return React.cloneElement(children as React.ReactElement, {
        className: classes,
        ...props,
        ref,
      });
    }

    return (
      <button className={classes} ref={ref} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
