import api from './api.js';
import { ActivityDocument } from '../types/activity';

export const fetchUserActivities = async (limit = 10): Promise<ActivityDocument[]> => {
  try {
    const response = await api.get(`/api/user/activity?limit=${limit}`);
    return response.data.activities;
  } catch (error) {
    console.error('Error fetching user activities:', error);
    throw error;
  }
};

export const fetchActivityStats = async () => {
  try {
    const response = await api.get('/api/user/activity/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    throw error;
  }
};

export const fetchDailyActivityCount = async (days = 30) => {
  try {
    const response = await api.get(`/api/user/activity/stats/daily?days=${days}`);
    return response.data.dailyCount;
  } catch (error) {
    console.error('Error fetching daily activity count:', error);
    throw error;
  }
};

export const logActivity = async (activityData: Partial<ActivityDocument>): Promise<void> => {
  try {
    await api.post('/api/user/activity', activityData);
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw - we don't want tracking errors to affect user experience
  }
};