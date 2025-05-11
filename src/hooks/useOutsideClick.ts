
import { useEffect, RefObject } from 'react';

export const useOutsideClick = (
  ref: RefObject<HTMLElement>,
  callback: () => void,
  exceptRefs: RefObject<HTMLElement>[] = []
) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!ref.current) return; // Skip if ref is not attached
      
      // Check if the click was outside the ref element 
      const isOutside = !ref.current.contains(event.target as Node);
      
      // Check if the click wasn't on any of the exception elements
      const notOnExceptions = exceptRefs.every(exceptRef => 
        !exceptRef.current || !exceptRef.current.contains(event.target as Node)
      );
      
      if (isOutside && notOnExceptions) {
        callback();
      }
    };

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, callback, exceptRefs]);
};

export default useOutsideClick;
