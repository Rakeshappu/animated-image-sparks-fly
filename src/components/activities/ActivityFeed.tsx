
import { useEffect, useState } from 'react';
import { Clock, Book, Eye } from 'lucide-react';

// Define the Activity type to match the backend structure
interface Activity {
  _id: string;
  type: 'view' | 'download' | 'like' | 'comment' | 'upload' | 'share';
  timestamp: string;
  message?: string;
  resource?: {
    _id: string;
    title: string;
  };
}

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'view':
      return <Eye className="h-5 w-5 text-purple-500" />;
    case 'upload':
    case 'download':
      return <Book className="h-5 w-5 text-blue-500" />;
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

  useEffect(() => {
    if (propActivities && propActivities.length > 0) {
      setActivities(propActivities);
      setIsLoading(false);
    } else {
      setActivities([]);
      setIsLoading(false);
    }
  }, [propActivities]);

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

  const formatMessage = (activity: Activity) => {
    if (activity.message) return activity.message;
    
    switch (activity.type) {
      case 'view':
        return `Viewed ${activity.resource?.title || 'a resource'}`;
      case 'download':
        return `Downloaded ${activity.resource?.title || 'a resource'}`;
      case 'upload':
        return `Uploaded ${activity.resource?.title || 'a resource'}`;
      case 'like':
        return `Liked ${activity.resource?.title || 'a resource'}`;
      case 'comment':
        return `Commented on ${activity.resource?.title || 'a resource'}`;
      case 'share':
        return `Shared ${activity.resource?.title || 'a resource'}`;
      default:
        return `Interacted with ${activity.resource?.title || 'a resource'}`;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activities</h3>
      
      {activities && activities.length > 0 ? (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity._id} className="flex items-center space-x-3">
              {getActivityIcon(activity.type)}
              <div className="flex-1">
                <p className="text-sm text-gray-700">{formatMessage(activity)}</p>
                <p className="text-xs text-gray-500">
                  {new Date(activity.timestamp).toLocaleTimeString()}
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
