
import api from './api';

/**
 * Gets recent activities
 * @param limit - Number of activities to retrieve
 * @returns Promise<any[]> - Array of recent activities
 */
export const getRecentActivities = async (limit: number = 10): Promise<any[]> => {
  try {
    const response = await api.get(`/api/user/activity?limit=${limit}`);
    return response.data.activities || [];
  } catch (error) {
    console.error("Error getting recent activities:", error);
    return [];
  }
};

/**
 * Logs an activity
 * @param data - Activity data object or resource ID
 * @param type - Type of activity (if first param is resource ID)
 * @param source - Source of activity (if first param is resource ID)
 * @returns Promise<any> - The logged activity
 */
export const logActivity = async (
  data: { type: string; resourceId: string; message: string } | string,
  type?: string,
  source?: string
): Promise<any> => {
  try {
    // Handle both object-based and parameter-based calls
    let payload: any;
    
    if (typeof data === 'object') {
      // If first parameter is an object with activity data
      payload = {
        resource: data.resourceId,
        type: data.type,
        message: data.message,
        source: source || 'other'
      };
    } else {
      // Legacy approach: If first parameter is resourceId
      payload = {
        resource: data, // data is resourceId
        type: type || 'view',
        source: source || 'other'
      };
    }

    const response = await api.post('/api/user/activity', payload);
    return response.data;
  } catch (error) {
    console.error("Error logging activity:", error);
    throw error;
  }
};

/**
 * Increments the view count for a resource
 * @param resourceId - ID of the resource to increment view count
 * @returns Promise<any> - Updated resource view count
 */
export const incrementResourceView = async (resourceId: string): Promise<any> => {
  try {
    const response = await api.post(`/api/resources/${resourceId}/view`);
    return response.data;
  } catch (error) {
    console.error("Error incrementing resource view:", error);
    return { success: false, error: "Failed to increment view count" };
  }
};

/**
 * Refreshes activities from the server with cache busting
 * @param limit - Number of activities to retrieve
 * @returns Promise<any[]> - Array of recent activities
 */
export const refreshActivities = async (limit: number = 10): Promise<any[]> => {
  try {
    // Add cache busting parameter
    const response = await api.get(`/api/user/activity?limit=${limit}&_t=${new Date().getTime()}`);
    return response.data.activities || [];
  } catch (error) {
    console.error("Error refreshing activities:", error);
    return [];
  }
};

/**
 * Gets user's daily streak count
 */
export const getUserDailyStreak = async (userId?: string) => {
  try {
    // If user ID is provided, use it, otherwise the backend will use the current user
    const endpoint = userId ? `/api/user/activity/stats?userId=${userId}` : '/api/user/activity/stats';
    const response = await api.get(endpoint);
    
    if (response.data && response.data.streak !== undefined) {
      return response.data.streak;
    }
    
    return 0; // Default streak value
  } catch (error) {
    console.error("Error getting user streak:", error);
    return 0;
  }
};

/**
 * Gets activities for today
 */
export const getTodayActivities = async (userId?: string) => {
  try {
    // If user ID is provided, use it, otherwise the backend will use the current user
    const endpoint = userId ? `/api/user/activity?period=today&userId=${userId}` : '/api/user/activity?period=today';
    const response = await api.get(endpoint);
    
    return response.data.activities || [];
  } catch (error) {
    console.error("Error getting today's activities:", error);
    return [];
  }
};

/**
 * Gets weekly activity data for charts
 */
export const getWeeklyActivities = async (userId?: string) => {
  try {
    // If user ID is provided, use it, otherwise the backend will use the current user
    const endpoint = userId ? `/api/user/activity/stats?period=week&userId=${userId}` : '/api/user/activity/stats?period=week';
    const response = await api.get(endpoint);
    
    if (response.data && Array.isArray(response.data.weeklyStats)) {
      return response.data.weeklyStats;
    }
    
    return [];
  } catch (error) {
    console.error("Error getting weekly activities:", error);
    return [];
  }
};

export const activityService = {
  getRecentActivities,
  logActivity,
  getUserDailyStreak,
  getTodayActivities,
  getWeeklyActivities,
  incrementResourceView,
  refreshActivities
};
