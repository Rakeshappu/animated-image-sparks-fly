
import api from './api.ts';
import { toast } from 'react-hot-toast';

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

  async getRecentActivities(limit = 3, semester?: number) {
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
  
  // Update view count for resources with improved error handling
  async incrementResourceView(resourceId: string) {
    try {
      // Don't require token, allow anonymous views
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const response = await api.post(`/api/resources/${resourceId}/view`, {}, { headers });
      
      console.log('View count updated response:', response.data);
      
      if (response.data.success) {
        // Notify of successful view
        const resourceCategory = response.data.category || '';
        const resourceType = resourceCategory === 'placement' ? 'placement' : 'study';
        
        // Don't show toast for every view to avoid spamming
        // toast.success(`Viewing ${resourceType} resource`);
        
        // Force refresh activities immediately after view
        this.refreshActivities();
        
        // Return the updated view data
        return { 
          success: true, 
          views: response.data.views,
          resourceTitle: response.data.resourceTitle,
          resourceId: response.data.resourceId,
          timestamp: response.data.timestamp
        };
      } else {
        console.error('View update returned an error:', response.data);
        return { success: false };
      }
    } catch (error) {
      console.error('Failed to increment view count:', error);
      return { success: false };
    }
  },
  
  // New method to refresh activities after view action
  async refreshActivities() {
    try {
      // Clear any cache and force a fresh fetch
      const response = await api.get(`/api/user/activity?limit=3&_t=${Date.now()}`);
      // Dispatch a global event that components can listen for
      const refreshEvent = new CustomEvent('activitiesRefreshed', {
        detail: { activities: response.data.activities || [] }
      });
      document.dispatchEvent(refreshEvent);
      return response.data.activities || [];
    } catch (error) {
      console.error('Failed to refresh activities:', error);
      return [];
    }
  },
  
  // Get activity details with full analytics
  async getActivityWithAnalytics(activityId: string) {
    try {
      const response = await api.get(`/api/user/activity/${activityId}/analytics`);
      return response.data || null;
    } catch (error) {
      console.error('Failed to fetch activity analytics:', error);
      return null;
    }
  }
};

// Make sure to export both the named and default export
export { activityService };
export default activityService;
