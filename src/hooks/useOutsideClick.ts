
import { useEffect, RefObject } from 'react';

/**
 * Hook that alerts when you click outside the passed ref
 */
export function useOutsideClick(ref: RefObject<HTMLElement>, callback: () => void) {
  useEffect(() => {
    /**
     * Alert if clicked on outside of element
     */
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    }

    // Bind the event listener
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => {
      // Unbind the event listener on cleanup
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [ref, callback]);
}
