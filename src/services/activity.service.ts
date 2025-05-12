
import api from './api.js';
import { ActivityDocument } from '../types/activity';

export class ActivityService {
  async fetchUserActivities(limit = 10): Promise<ActivityDocument[]> {
    try {
      const response = await api.get(`/api/user/activity?limit=${limit}`);
      return response.data.activities;
    } catch (error) {
      console.error('Error fetching user activities:', error);
      throw error;
    }
  }

  async fetchActivityStats() {
    try {
      const response = await api.get('/api/user/activity/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching activity stats:', error);
      throw error;
    }
  }

  async fetchDailyActivityCount(days = 30) {
    try {
      const response = await api.get(`/api/user/activity/stats/daily?days=${days}`);
      return response.data.dailyCount;
    } catch (error) {
      console.error('Error fetching daily activity count:', error);
      throw error;
    }
  }

  async logActivity(activityData: Partial<ActivityDocument>): Promise<void> {
    try {
      await api.post('/api/user/activity', activityData);
    } catch (error) {
      console.error('Error logging activity:', error);
      // Don't throw - we don't want tracking errors to affect user experience
    }
  }

  // Add the missing methods
  async refreshActivities(limit = 10): Promise<ActivityDocument[]> {
    try {
      const timestamp = new Date().getTime();
      const response = await api.get(`/api/user/activity?limit=${limit}&_nocache=${timestamp}`);
      return response.data.activities;
    } catch (error) {
      console.error('Error refreshing activities:', error);
      throw error;
    }
  }

  async incrementResourceView(resourceId: string) {
    try {
      const response = await api.post(`/api/resources/${resourceId}/view`);
      return response.data;
    } catch (error) {
      console.error('Error incrementing resource view:', error);
      return { success: false };
    }
  }

  async getRecentActivities(limit = 5): Promise<ActivityDocument[]> {
    try {
      const response = await api.get(`/api/user/activity?limit=${limit}`);
      return response.data.activities;
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      return [];
    }
  }
}

export const activityService = new ActivityService();
