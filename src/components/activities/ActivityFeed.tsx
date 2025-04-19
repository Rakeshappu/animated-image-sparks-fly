
import { useEffect, useState } from 'react';
import { Activity } from '../../types';
import { Clock, Book, Eye } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'view':
      return <Eye className="h-5 w-5 text-purple-500" />;
    case 'resource':
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
  const { user } = useAuth();

  useEffect(() => {
    if (propActivities) {
      setActivities(propActivities);
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

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activities</h3>
      
      {activities && activities.length > 0 ? (
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
