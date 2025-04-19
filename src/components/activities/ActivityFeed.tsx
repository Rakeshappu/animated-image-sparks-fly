import { useEffect, useState } from 'react';
import { Activity } from '../../types';
import { Clock, Award, Download, Eye, Upload, MessageSquare, Share2 } from 'lucide-react';
import { activityService } from '../../services/activity.service';
import { useAuth } from '../../hooks/useAuth'; 

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'upload':
      return <Upload className="h-5 w-5 text-green-500" />;
    case 'download':
      return <Download className="h-5 w-5 text-blue-500" />;
    case 'view':
      return <Eye className="h-5 w-5 text-purple-500" />;
    case 'like':
      return <Award className="h-5 w-5 text-yellow-500" />;
    case 'comment':
      return <MessageSquare className="h-5 w-5 text-orange-500" />;
    case 'share':
      return <Share2 className="h-5 w-5 text-indigo-500" />;
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
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (propActivities) {
      setActivities(propActivities);
      setIsLoading(false);
      return;
    }

    const fetchActivities = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch activities specific to the user's semester
        const fetchedActivities = await activityService.getRecentActivities(10, user?.semester);
        
        if (Array.isArray(fetchedActivities)) {
          setActivities(fetchedActivities);
        } else {
          console.error('Fetched activities is not an array:', fetchedActivities);
          setActivities([]);
        }
      } catch (error) {
        console.error('Failed to fetch activities:', error);
        setError('Failed to load activities. Please try again later.');
        setActivities([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, [propActivities, user]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activities</h3>
      
      {isLoading ? (
        <div className="py-4 flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <p className="text-red-500 text-center py-4">{error}</p>
      ) : activities && activities.length > 0 ? (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity._id} className="flex items-center space-x-3">
              {getActivityIcon(activity.type)}
              <div className="flex-1">
                <p className="text-sm text-gray-700">{activity.message}</p>
                <p className="text-xs text-gray-500">
                  {new Date(activity.timestamp).toLocaleTimeString()}
                </p>
              </div>
              {activity.resource && (
                <span className="text-sm font-medium text-indigo-600">
                  {activity.resource.title}
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-4">No recent activities</p>
      )}
    </div>
  );
};
