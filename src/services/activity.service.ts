
import api from './api';

export const activityService = {
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
      return response.data.activities;
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
  }
};
