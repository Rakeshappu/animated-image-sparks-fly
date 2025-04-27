
import { useEffect, useState } from 'react';
import { Clock, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { activityService } from '../../services/activity.service';

interface Activity {
  _id: string;
  type: 'view';
  timestamp: string;
  resource: {
    _id: string;
    title: string;
    fileUrl?: string;
  };
}

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'view':
      return <Eye className="h-5 w-5 text-purple-500" />;
    default:
      return <Clock className="h-5 w-5 text-gray-500" />;
  }
};

interface ActivityFeedProps {
  activities?: Activity[];
}

export const ActivityFeed = ({ activities: propActivities }: ActivityFeedProps) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecentActivities();
  }, []);

  const fetchRecentActivities = async () => {
    try {
      setIsLoading(true);
      const response = await activityService.getRecentActivities(3);
      console.log('Fetched activities:', response);
      if (Array.isArray(response) && response.length > 0) {
        setActivities(response);
      } else {
        console.log('No recent activities found');
        if (propActivities && propActivities.length > 0) {
          setActivities(propActivities.slice(0, 3));
        } else {
          setActivities([]);
        }
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      // If API fails, try to use prop activities
      if (propActivities && propActivities.length > 0) {
        setActivities(propActivities.slice(0, 3));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResourceClick = async (resourceId: string) => {
    try {
      // Increment view count
      await api.post(`/api/resources/${resourceId}/view`);
      
      // Log the activity
      await activityService.logActivity({
        type: 'view',
        resourceId,
        message: 'Viewed resource'
      });
      
      // Navigate to the resource
      navigate(`/resources/${resourceId}`);
    } catch (error) {
      console.error('Error viewing resource:', error);
      toast.error('Failed to open resource');
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
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
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activities</h3>
      
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
                <p className="text-sm text-gray-700">
                  {activity.resource?.title || 'Untitled Resource'}
                </p>
                <p className="text-xs text-gray-500">
                  {formatTime(activity.timestamp)}
                </p>
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
