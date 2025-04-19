
import React, { useState, useRef, useEffect } from 'react';

// DropdownMenu component
export const DropdownMenu = ({ children, onOpenChange }: { children: React.ReactNode, onOpenChange?: (open: boolean) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const toggleOpen = (open: boolean) => {
    setIsOpen(open);
    if (onOpenChange) {
      onOpenChange(open);
    }
  };

  return (
    <DropdownMenuContext.Provider value={{ isOpen, toggleOpen }}>
      <div className="relative inline-block text-left">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
};

// Context for state management
type DropdownMenuContextType = {
  isOpen: boolean;
  toggleOpen: (open: boolean) => void;
};

const DropdownMenuContext = React.createContext<DropdownMenuContextType | undefined>(undefined);

// Hook to use the dropdown context
const useDropdownMenu = () => {
  const context = React.useContext(DropdownMenuContext);
  if (context === undefined) {
    throw new Error('useDropdownMenu must be used within a DropdownMenu');
  }
  return context;
};

// Trigger component
export const DropdownMenuTrigger = ({ children, asChild }: { children: React.ReactNode, asChild?: boolean }) => {
  const { isOpen, toggleOpen } = useDropdownMenu();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleOpen(!isOpen);
  };

  if (asChild) {
    return React.cloneElement(children as React.ReactElement, {
      onClick: handleClick,
      'aria-expanded': isOpen,
      'aria-haspopup': true,
    });
  }

  return (
    <button onClick={handleClick} aria-expanded={isOpen} aria-haspopup="true">
      {children}
    </button>
  );
};

// Content component
export const DropdownMenuContent = ({ 
  children, 
  align = 'center', 
  className = '' 
}: { 
  children: React.ReactNode, 
  align?: 'start' | 'center' | 'end', 
  className?: string 
}) => {
  const { isOpen, toggleOpen } = useDropdownMenu();
  const contentRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        toggleOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, toggleOpen]);

  if (!isOpen) return null;

  const alignmentClasses = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
  };

  return (
    <div 
      className={`absolute mt-2 z-50 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white p-1 shadow-md animate-in fade-in-80 ${alignmentClasses[align]} ${className}`}
      ref={contentRef}
    >
      {children}
    </div>
  );
};

// Separator component
export const DropdownMenuSeparator = ({ className = '' }: { className?: string }) => {
  return <div className={`-mx-1 my-1 h-px bg-gray-200 ${className}`} />;
};

// Item component
export const DropdownMenuItem = ({ children, className = '', disabled = false }: { 
  children: React.ReactNode, 
  className?: string,
  disabled?: boolean 
}) => {
  const { toggleOpen } = useDropdownMenu();

  const handleClick = () => {
    if (!disabled) {
      // Close the dropdown when item is clicked
      setTimeout(() => toggleOpen(false), 100);
    }
  };

  return (
    <div 
      className={`relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-gray-100 hover:bg-gray-100 ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      onClick={handleClick}
      role="menuitem"
    >
      {children}
    </div>
  );
};
