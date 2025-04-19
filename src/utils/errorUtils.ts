
export const getErrorMessage = (error: any): string => {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'object' && error !== null) {
    // Extract message from API error response
    if (error.response && error.response.data) {
      const { data } = error.response;
      
      if (typeof data === 'string') {
        return data;
      }
      
      if (data.error) {
        return typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
      }
      
      if (data.message) {
        return typeof data.message === 'string' ? data.message : JSON.stringify(data.message);
      }
    }
    
    // Handle file operation errors
    if (error.code) {
      switch (error.code) {
        case 'ENOENT':
          return 'File not found. It may have been moved or deleted.';
        case 'EACCES':
          return 'Permission denied. You do not have access to this file.';
        case 'EISDIR':
          return 'Cannot perform this operation on a directory.';
        default:
          return `File operation error: ${error.code}`;
      }
    }
    
    // Try to convert object to string for debugging
    try {
      return JSON.stringify(error);
    } catch (e) {
      // If JSON.stringify fails, return a generic message
      return 'An unexpected error occurred. Please try again.';
    }
  }
  
  return 'An unexpected error occurred. Please try again.';
};

// Additional error utils
export const isNetworkError = (error: any): boolean => {
  return !!(error && (
    error.message === 'Network Error' ||
    (error.response && error.response.status === 0) ||
    (error.code && ['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT'].includes(error.code))
  ));
};

export const isServerError = (error: any): boolean => {
  return !!(error && error.response && error.response.status >= 500);
};

export const isAuthError = (error: any): boolean => {
  return !!(error && error.response && (error.response.status === 401 || error.response.status === 403));
};

export const handleApiError = (error: any, toast?: any): string => {
  const message = getErrorMessage(error);
  
  if (toast) {
    toast.error(message);
  }
  
  if (isAuthError(error)) {
    // If it's an auth error, could trigger a logout or redirect to login
    console.warn('Authentication error detected');
    // Potentially call a logout function here
  }
  
  console.error('API Error:', error);
  return message;
};
