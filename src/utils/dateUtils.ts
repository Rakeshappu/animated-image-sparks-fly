
import { format, parseISO, addDays, formatDistanceToNow } from 'date-fns';

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatTime = (date: string): string => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Helper function to safely format dates
export const formatDateSafely = (dateString: string, formatter: string): string => {
  try {
    // Check if the string is valid before parsing
    if (!dateString || dateString === 'null' || dateString === 'undefined') {
      return 'Unknown date';
    }
    return format(parseISO(dateString), formatter);
  } catch (err) {
    console.error('Error formatting date:', dateString, err);
    return 'Invalid date';
  }
};

// Helper function to safely add days to a date
export const addDaysSafely = (dateString: string, days: number, formatter: string): string => {
  try {
    if (!dateString || dateString === 'null' || dateString === 'undefined') {
      return 'Unknown date';
    }
    const date = parseISO(dateString);
    return format(addDays(date, days), formatter);
  } catch (err) {
    console.error('Error adding days to date:', dateString, err);
    return 'Invalid date';
  }
};

// Format date to relative time (e.g., "2 hours ago")
export const formatDateToRelative = (dateString: string): string => {
  try {
    if (!dateString || dateString === 'null' || dateString === 'undefined') {
      return 'Unknown time';
    }
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (err) {
    console.error('Error formatting relative date:', dateString, err);
    return 'Invalid date';
  }
};

// Format time based on how recent it is
export const formatTimeAgo = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
  }
  catch (e) {
    console.error('Error formatting time ago:', e);
    return 'recent';
  }
};
