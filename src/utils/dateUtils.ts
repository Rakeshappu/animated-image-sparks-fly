
/**
 * Format a date string or timestamp to a human-readable relative time (e.g., "2 hours ago")
 * @param {string|Date} date - Date string, timestamp, or Date object
 * @returns {string} Formatted relative time string
 */
export const formatTimeAgo = (date: string | Date | number): string => {
  if (!date) return 'Unknown date';
  
  try {
    const now = new Date();
    const parsedDate = typeof date === 'string' || typeof date === 'number' 
      ? new Date(date) 
      : date;
    
    // Check if the parsed date is valid
    if (isNaN(parsedDate.getTime())) {
      // Try to parse various date formats
      if (typeof date === 'string') {
        // If it's a MongoDB ObjectId, extract the timestamp from its first 4 bytes
        if (/^[0-9a-fA-F]{24}$/.test(date)) {
          const timestamp = parseInt(date.substring(0, 8), 16) * 1000;
          parsedDate.setTime(timestamp);
          if (!isNaN(parsedDate.getTime())) {
            console.log(`Parsed ObjectId date: ${parsedDate}`);
          } else {
            return 'Recently';
          }
        } else {
          return 'Recently'; 
        }
      } else {
        return 'Recently';
      }
    }
    
    const secondsDiff = Math.floor((now.getTime() - parsedDate.getTime()) / 1000);
    
    // Less than a minute
    if (secondsDiff < 60) {
      return 'Just now';
    }
    
    // Less than an hour
    if (secondsDiff < 3600) {
      const minutes = Math.floor(secondsDiff / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    
    // Less than a day
    if (secondsDiff < 86400) {
      const hours = Math.floor(secondsDiff / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }
    
    // Less than a week
    if (secondsDiff < 604800) {
      const days = Math.floor(secondsDiff / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
    
    // Less than a month
    if (secondsDiff < 2592000) {
      const weeks = Math.floor(secondsDiff / 604800);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    }
    
    // Less than a year
    if (secondsDiff < 31536000) {
      const months = Math.floor(secondsDiff / 2592000);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    }
    
    // More than a year
    const years = Math.floor(secondsDiff / 31536000);
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
    
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Recently';
  }
};

/**
 * Format a date to a standard date format (e.g., "Jan 1, 2023")
 * @param {string|Date} date - Date string, timestamp, or Date object
 * @returns {string} Formatted date string
 */
export const formatDate = (date: string | Date): string => {
  if (!date) return 'Unknown date';
  
  try {
    const parsedDate = typeof date === 'string' ? new Date(date) : date;
    
    // Check if the parsed date is valid
    if (isNaN(parsedDate.getTime())) {
      return 'Invalid date';
    }
    
    return parsedDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Unknown date';
  }
};

/**
 * Safely format a date with fallback for invalid dates
 * @param {string|Date} date - Date string or Date object
 * @returns {string} Formatted date string or fallback message
 */
export const formatDateSafely = (date: string | Date | null | undefined): string => {
  if (!date) return 'N/A';
  
  try {
    const parsedDate = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(parsedDate.getTime())) {
      return 'Invalid date';
    }
    
    return parsedDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date safely:', error);
    return 'N/A';
  }
};

/**
 * Safely add days to a date with fallback for invalid dates
 * @param {Date} date - Base date
 * @param {number} days - Number of days to add
 * @returns {Date} New date with added days or current date as fallback
 */
export const addDaysSafely = (date: Date | string | null | undefined, days: number): Date => {
  try {
    const parsedDate = date ? (typeof date === 'string' ? new Date(date) : date) : new Date();
    
    if (isNaN(parsedDate.getTime())) {
      return new Date(); // Return current date as fallback
    }
    
    const result = new Date(parsedDate);
    result.setDate(result.getDate() + days);
    return result;
  } catch (error) {
    console.error('Error adding days to date:', error);
    return new Date(); // Return current date as fallback
  }
};
