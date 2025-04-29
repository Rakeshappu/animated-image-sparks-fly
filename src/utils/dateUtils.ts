
import { format, parseISO, addDays } from 'date-fns';

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
export const formatDateToRelative = (dateString: string): string => {}