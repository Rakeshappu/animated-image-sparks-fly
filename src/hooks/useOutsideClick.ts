
import { useEffect, RefObject } from 'react';

/**
 * A hook that detects clicks outside of a specified element
 * @param ref - Reference to the element to detect clicks outside of
 * @param callback - Function to call when a click outside is detected
 */
export const useOutsideClick = (
  ref: RefObject<HTMLElement>,
  callback: () => void
) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, callback]);
};

export default useOutsideClick;
