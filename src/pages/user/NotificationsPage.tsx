import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, RefreshCw } from 'lucide-react';
import api from '../../services/api.ts';
import { useAuth } from '../../hooks/useAuth.ts';
import { toast } from 'react-hot-toast';
import { Notification } from '../../types/auth.ts';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/user/notifications');
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast.error('Could not load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    try {
      await api.put(`/api/user/notifications/${notificationId}/read`);
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification._id === notificationId ? { ...notification, read: true } : notification
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast.error('Could not update notification');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await api.delete(`/api/user/notifications/${notificationId}`);
      setNotifications(prevNotifications => 
        prevNotifications.filter(notification => notification._id !== notificationId)
      );
      toast.success('Notification removed');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Could not delete notification');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/api/user/notifications/read-all');
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({ ...notification, read: true }))
      );
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      toast.error('Could not update notifications');
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read first
    if (!notification.read && notification._id) {
      markAsRead(notification._id);
    }
    
    // Navigate based on the resource id if available
    if (notification.resourceId) {
      navigate(`/resources/${notification.resourceId}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center">
          <Bell className="mr-3 h-6 w-6 text-indigo-600" />
          Notifications
        </h1>
        <div className="flex space-x-2">
          <button 
            onClick={markAllAsRead} 
            disabled={loading || notifications.every(n => n.read)}
            className={`
              flex items-center px-3 py-1.5 text-sm rounded-md border 
              ${notifications.some(n => !n.read) 
                ? 'border-indigo-300 text-indigo-700 hover:bg-indigo-50' 
                : 'border-gray-200 text-gray-400 cursor-not-allowed'}
            `}
          >
            <Check className="h-4 w-4 mr-1" /> 
            Mark all read
          </button>
          <button 
            onClick={fetchNotifications}
            className="flex items-center px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="mt-2 text-gray-500">Loading notifications...</p>
        </div>
      )}

      {!loading && notifications.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Bell className="mx-auto h-12 w-12 text-gray-300" />
          <h2 className="mt-2 text-lg font-medium text-gray-900">No notifications</h2>
          <p className="mt-1 text-sm text-gray-500">You're all caught up! You don't have any notifications at the moment.</p>
        </div>
      )}

      {notifications.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {notifications.map((notification, index) => (
            <motion.div
              key={notification._id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`
                border-b border-gray-200 last:border-0 p-4 cursor-pointer
                ${notification.read ? 'bg-white' : 'bg-indigo-50'}
              `}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start">
                <div className="h-2 w-2 mt-1.5 rounded-full mr-3 flex-shrink-0">
                  {!notification.read && <div className="bg-indigo-600 h-2 w-2 rounded-full"></div>}
                </div>
                <div className="flex-grow min-w-0">
                  <p className="text-gray-900">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {notification.createdAt && formatDate(notification.createdAt)}
                  </p>
                </div>
                <button 
                  className="ml-2 p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (notification._id) {
                      deleteNotification(notification._id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;