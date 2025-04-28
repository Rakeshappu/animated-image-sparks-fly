
import { useEffect, useState } from 'react';
import { Clock, Eye, Download, Upload, Heart, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { activityService } from '../../services/activity.service';

interface Activity {
  _id: string;
  type: 'view' | 'download' | 'like' | 'comment' | 'upload' | 'share';
  timestamp: string;
  message?: string;
  resource: {
    _id: string;
    title: string;
    fileUrl?: string;
    subject: string;
    stats?: {
      views: number;
    };
  };
}

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'view':
      return <Eye className="h-5 w-5 text-blue-500" />;
    case 'download':
      return <Download className="h-5 w-5 text-green-500" />;
    case 'upload':
      return <Upload className="h-5 w-5 text-purple-500" />;
    case 'like':
      return <Heart className="h-5 w-5 text-red-500" />;
    case 'comment':
      return <MessageSquare className="h-5 w-5 text-yellow-500" />;
    default:
      return <Clock className="h-5 w-5 text-gray-500" />;
  }
};

interface ActivityFeedProps {
  activities?: Activity[];
  refreshInterval?: number; // Time in ms to refresh activities
}

export const ActivityFeed = ({ activities: propActivities, refreshInterval = 5000 }: ActivityFeedProps) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Initial fetch
    fetchRecentActivities();
    
    // Set up polling to refresh activities regularly
    const intervalId = setInterval(fetchRecentActivities, refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [refreshInterval]);

  // Use prop activities if provided
  useEffect(() => {
    if (propActivities && propActivities.length > 0) {
      setActivities(propActivities.slice(0, 10));
      setIsLoading(false);
    }
  }, [propActivities]);

  const fetchRecentActivities = async () => {
    try {
      setIsLoading(true);
      // Force refresh by adding timestamp to avoid cache
      const data = await activityService.refreshActivities();
      
      if (Array.isArray(data) && data.length > 0) {
        console.log('Fetched activities from service:', data);
        setActivities(data);
      } else {
        console.log('No activities found or empty array returned');
        // Try direct API call as fallback
        const response = await api.get('/api/user/activity?limit=10&_nocache=' + new Date().getTime());
        
        if (response.data && Array.isArray(response.data.activities)) {
          console.log('Fetched activities from direct API:', response.data.activities);
          setActivities(response.data.activities);
        } else {
          console.warn('No activities found in API response');
          // Fallback to prop activities if available
          if (propActivities && propActivities.length > 0) {
            setActivities(propActivities.slice(0, 10));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      // If API fails, try to use prop activities
      if (propActivities && propActivities.length > 0) {
        setActivities(propActivities.slice(0, 10));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResourceClick = async (resourceId: string) => {
    try {
      // Increment view count
      await activityService.incrementResourceView(resourceId);
      
      // Log the activity
      await activityService.logActivity({
        type: 'view',
        resourceId,
        message: 'Viewed resource'
      });
      
      // Force refresh activities to show the new view
      setTimeout(fetchRecentActivities, 500);
      
      // Navigate to the resource
      navigate(`/resources/${resourceId}`);
    } catch (error) {
      console.error('Error viewing resource:', error);
      toast.error('Failed to open resource');
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.round(diffMs / 60000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      
      if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (e) {
      return 'Recent';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activities</h3>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4 mt-2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Recent Activities</h3>
        <button 
          onClick={fetchRecentActivities} 
          className="text-xs text-indigo-600 hover:text-indigo-800"
        >
          Refresh
        </button>
      </div>
      
      {activities && activities.length > 0 ? (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div 
              key={activity._id} 
              className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors"
              onClick={() => activity.resource && handleResourceClick(activity.resource._id)}
            >
              {getActivityIcon(activity.type)}
              <div className="flex-1">
                <p className="text-sm text-gray-700 line-clamp-1">
                  {activity.resource?.title || 'Untitled Resource'}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    {formatTime(activity.timestamp)}
                  </span>
                  <span className="text-xs text-gray-500 capitalize">
                    {activity.type}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-4">No recent activities</p>
      )}
    </div>
  );
};
