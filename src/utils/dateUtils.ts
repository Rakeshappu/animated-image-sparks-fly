
/**
 * Formats a date string to a relative time string (e.g., "2 days ago")
 */
export const formatTimeAgo = (dateString: string): string => {
  if (!dateString) return 'Unknown date';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    // Handle invalid date
    if (isNaN(date.getTime())) return 'Just now';
    
    // Less than a minute
    if (seconds < 60) {
      return 'Just now';
    }
    
    // Less than an hour
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    
    // Less than a day
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }
    
    // Less than a month
    const days = Math.floor(hours / 24);
    if (days < 30) {
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
    
    // Less than a year
    const months = Math.floor(days / 30);
    if (months < 12) {
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    }
    
    // More than a year
    const years = Math.floor(months / 12);
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
  } catch (e) {
    console.error('Error formatting date:', e);
    return 'Unknown date';
  }
};

/**
 * Format a date with a specific format
 */
export const formatDate = (dateString: string, format: string = 'MM/DD/YYYY'): string => {
  if (!dateString) return 'Unknown date';
  
  try {
    const date = new Date(dateString);
    
    // Handle invalid date
    if (isNaN(date.getTime())) return 'Unknown date';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Replace format tokens with values
    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day);
  } catch (e) {
    console.error('Error formatting date:', e);
    return 'Unknown date';
  }
};

// Add a formatDateToRelative alias for backward compatibility
export const formatDateToRelative = formatTimeAgo;

/**
 * Safely format a date with fallback for invalid dates
 */
export const formatDateSafely = (dateString: string, format: string = 'MM/DD/YYYY'): string => {
  if (!dateString) return 'Unknown date';
  
  try {
    const date = new Date(dateString);
    
    // Handle invalid date
    if (isNaN(date.getTime())) return 'Unknown date';
    
    return formatDate(dateString, format);
  } catch (e) {
    console.error('Error formatting date safely:', e);
    return 'Unknown date';
  }
};

/**
 * Add days to a date and return formatted string
 */
export const addDaysSafely = (dateString: string, daysToAdd: number, format: string = 'MM/DD/YYYY'): string => {
  if (!dateString) return 'Unknown date';
  
  try {
    const date = new Date(dateString);
    
    // Handle invalid date
    if (isNaN(date.getTime())) return 'Unknown date';
    
    // Add days
    date.setDate(date.getDate() + daysToAdd);
    
    return formatDateSafely(date.toISOString(), format);
  } catch (e) {
    console.error('Error adding days to date:', e);
    return 'Unknown date';
  }
};
