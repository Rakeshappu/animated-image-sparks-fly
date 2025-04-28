
import api from './api';

const activityService = {
  async logActivity(data: {
    type: 'upload' | 'download' | 'view' | 'like' | 'comment' | 'share';
    resourceId?: string;
    message: string;
  }) {
    try {
      const response = await api.post('/api/user/activity', data);
      return response.data;
    } catch (error) {
      console.error('Failed to log activity:', error);
      return null;
    }
  },

  async getRecentActivities(limit = 10, semester?: number) {
    try {
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      if (semester) params.append('semester', semester.toString());
      
      const response = await api.get(`/api/user/activity?${params.toString()}`);
      console.log('Recent activities response:', response.data);
      return response.data.activities || [];
    } catch (error) {
      console.error('Failed to fetch activities:', error);
      return [];
    }
  },

  async getUserDailyStreak() {
    try {
      const response = await api.get('/api/user/activity/stats');
      return response.data.streak || 0;
    } catch (error) {
      console.error('Failed to fetch user streak:', error);
      return 0;
    }
  },

  async getTodayActivities() {
    try {
      const response = await api.get('/api/user/activity/stats?period=today');
      return response.data.count || 0;
    } catch (error) {
      console.error('Failed to fetch today activities:', error);
      return 0;
    }
  },
  
  async getWeeklyActivities(isAdmin = false) {
    try {
      const url = isAdmin ? '/api/user/activity/stats?admin=true' : '/api/user/activity/stats';
      console.log('Fetching weekly activities from:', url);
      const response = await api.get(url);
      console.log('Weekly activities response:', response.data);
      return response.data.dailyActivity || [];
    } catch (error) {
      console.error('Failed to fetch weekly activities:', error);
      return [];
    }
  },

  async getResourceViewCount(resourceId: string) {
    try {
      const response = await api.get(`/api/resources/${resourceId}/stats`);
      return response.data.views || 0;
    } catch (error) {
      console.error('Failed to fetch resource view count:', error);
      return 0;
    }
  },
  
  // Add this new method to update view count for resources
  async incrementResourceView(resourceId: string) {
    try {
      const token = localStorage.getItem('token');
      if (!token) return { success: false };
      
      const response = await api.post(`/api/resources/${resourceId}/view`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      return { 
        success: true, 
        views: response.data.views 
      };
    } catch (error) {
      console.error('Failed to increment view count:', error);
      return { success: false };
    }
  }
};

// Make sure to export both the named and default export
export { activityService };
export default activityService;
