
import  api  from './api';
import { Notification, User } from '../types/auth';

class UserService {
  // Get user profile
  async getProfile(): Promise<User> {
    const response = await api.get('/user/profile');
    return response.data;
  }

  // Update user profile
  async updateProfile(userData: Partial<User>): Promise<User> {
    const response = await api.patch('/user/profile', userData);
    return response.data;
  }

  // Update user password
  async updatePassword(currentPassword: string, newPassword: string): Promise<any> {
    const response = await api.post('/user/password', { 
      currentPassword, 
      newPassword 
    });
    return response.data;
  }

  // Get user activity
  async getUserActivity(): Promise<any> {
    const response = await api.get('/user/activity');
    return response.data;
  }

  // Get user notifications
  async getNotifications(): Promise<{ notifications: Notification[] }> {
    const response = await api.get('/user/notifications');
    return response.data;
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId: string): Promise<any> {
    const response = await api.put(`/user/notifications/${notificationId}/read`);
    return response.data;
  }

  // Mark all notifications as read
  async markAllNotificationsAsRead(): Promise<any> {
    const response = await api.put('/user/notifications/read-all');
    return response.data;
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<any> {
    const response = await api.delete(`/user/notifications/${notificationId}`);
    return response.data;
  }

  // Delete all notifications
  async deleteAllNotifications(): Promise<any> {
    const response = await api.delete('/user/notifications');
    return response.data;
  }
}

export const userService = new UserService();
