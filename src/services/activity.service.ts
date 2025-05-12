
import api from './api';

const activityService = {
  trackActivity: async (activityData: any) => {
    try {
      const response = await api.post('/api/user/activity', activityData);
      return response.data;
    } catch (error) {
      console.error('Error tracking activity:', error);
      throw error;
    }
  },
  
  getUserActivities: async (userId?: string, page = 1, limit = 10) => {
    try {
      const response = await api.get(`/api/user/activity/${userId || 'current'}?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user activities:', error);
      throw error;
    }
  },
  
  getUserDailyStreak: async (userId?: string) => {
    try {
      const response = await api.get(`/api/user/activity/stats?metric=streak&userId=${userId || 'current'}`);
      return response.data?.streak || 0;
    } catch (error) {
      console.error('Error fetching user streak:', error);
      return 0;
    }
  },

  getTodayActivities: async (userId?: string) => {
    try {
      const response = await api.get(`/api/user/activity?period=today&userId=${userId || 'current'}`);
      return response.data?.activities || [];
    } catch (error) {
      console.error('Error fetching today activities:', error);
      return [];
    }
  },

  getWeeklyActivities: async (userId?: string) => {
    try {
      const response = await api.get(`/api/user/activity?period=week&userId=${userId || 'current'}`);
      return response.data?.activities || [];
    } catch (error) {
      console.error('Error fetching weekly activities:', error);
      return [];
    }
  },

  incrementResourceView: async (resourceId: string) => {
    try {
      if (!resourceId) {
        console.error('No resource ID provided for view tracking');
        return { success: false };
      }
      const response = await api.post(`/api/resources/${resourceId}/view`);
      return { 
        success: true, 
        views: response.data?.viewCount || 0 
      };
    } catch (error) {
      console.error('Error incrementing resource view:', error);
      return { success: false };
    }
  },

  // Add the missing methods
  logActivity: async (activityData: { type: string; resourceId: string; message: string }) => {
    try {
      const response = await api.post('/api/user/activity/log', activityData);
      return response.data;
    } catch (error) {
      console.error('Error logging activity:', error);
      return null;
    }
  },

  refreshActivities: async () => {
    try {
      const response = await api.get('/api/user/activity/recent');
      return response.data?.activities || [];
    } catch (error) {
      console.error('Error refreshing activities:', error);
      return [];
    }
  },

  getRecentActivities: async (limit = 5) => {
    try {
      const response = await api.get(`/api/user/activity/recent?limit=${limit}`);
      return response.data?.activities || [];
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      return [];
    }
  }
};

export { activityService };
