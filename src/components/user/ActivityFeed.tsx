
import React, { useState, useEffect } from 'react';
import { activityService } from '../../services/activity.service';
import { Clock, Eye, ThumbsUp, Download, MessageSquare, BookOpen } from 'lucide-react';
import { useInterval } from '../../hooks/useInterval';
import { useNavigate } from 'react-router-dom';
import { DocumentViewer } from '../document/DocumentViewer';
import { formatDateToRelative } from '../../utils/dateUtils';

interface ActivityFeedProps {
  limit?: number;
  showTitle?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  className?: string;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  limit = 3, // Default to 3
  showTitle = true,
  autoRefresh = false,
  refreshInterval = 60000, // Default to 60 seconds
  className = '',
}) => {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const navigate = useNavigate();

  // Function to fetch activities
  const fetchActivities = async () => {
    try {
      const data = await activityService.getRecentActivities(limit);
      
      // Only update state if the data has changed (to prevent unnecessary re-renders)
      if (JSON.stringify(data) !== JSON.stringify(activities)) {
        setActivities(data);
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  // Set up auto-refresh
  useInterval(() => {
    if (autoRefresh) {
      // Use a silent refresh approach - no loader shown for auto-refresh
      fetchActivities();
    }
  }, refreshInterval);

  // Initial load
  useEffect(() => {
    fetchActivities();
  }, [limit, refreshKey]);

  // Function to get activity icon based on type
  const getActivityIcon = (activity: any) => {
    switch (activity.type) {
      case 'view':
        return <Eye className="h-4 w-4 text-blue-500" />;
      case 'like':
        return <ThumbsUp className="h-4 w-4 text-red-500" />;
      case 'download':
        return <Download className="h-4 w-4 text-green-500" />;
      case 'comment':
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  // Function to handle resource click
  const handleResourceClick = (activity: any) => {
    if (!activity.resource) return;
    
    if (activity.resource.fileUrl) {
      setSelectedResource(activity.resource);
      setShowDocumentViewer(true);
    } else {
      // Handle navigation to resource based on category
      if (activity.resource.category === 'placement') {
        navigate(`/placement-resources?category=${activity.resource.placementCategory || ''}`);
      } else {
        navigate(`/study-materials?subject=${activity.resource.subject || ''}`);
      }
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 w-full ${className}`}>
      {showTitle && (
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <BookOpen className="h-5 w-5 mr-2 text-indigo-600" />
            Recent Activities
          </h3>
          <button 
            onClick={() => {
              setLoading(true);
              setRefreshKey(prev => prev + 1); 
            }}
            className="text-xs text-gray-500 hover:text-indigo-600"
          >
            Refresh
          </button>
        </div>
      )}
      
      {loading ? (
        <div className="animate-pulse">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="flex items-start space-x-3 py-3 border-b border-gray-100 dark:border-gray-700">
              <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : activities.length > 0 ? (
        <div>
          <div className="space-y-1">
            {activities.map((activity) => (
              <div 
                key={activity._id} 
                className={`flex items-start space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors ${
                  activity.resource ? 'cursor-pointer' : ''
                }`}
                onClick={activity.resource ? () => handleResourceClick(activity) : undefined}
              >
                <div className="bg-gray-100 dark:bg-gray-700 rounded-full h-8 w-8 flex items-center justify-center">
                  {getActivityIcon(activity)}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    {activity.message}
                  </p>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>{formatDateToRelative(activity.timestamp)}</span>
                    {activity.source && (
                      <span className="ml-2 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                        {activity.source === 'study-materials' ? 'Study' : 
                         activity.source === 'placement' ? 'Placement' :
                         activity.source === 'bookmarks' ? 'Bookmarks' : 'Other'}
                      </span>
                    )}
                  </div>
                  {/* Add analytics info for the resource */}
                  {activity.resource && activity.resource.stats && (
                    <div className="flex space-x-3 mt-1 text-xs text-gray-500">
                      <div className="flex items-center">
                        <Eye className="h-3 w-3 mr-1" />
                        <span>{activity.resource.stats.views || 0}</span>
                      </div>
                      <div className="flex items-center">
                        <ThumbsUp className="h-3 w-3 mr-1" />
                        <span>{activity.resource.stats.likes || 0}</span>
                      </div>
                      <div className="flex items-center">
                        <Download className="h-3 w-3 mr-1" />
                        <span>{activity.resource.stats.downloads || 0}</span>
                      </div>
                      <div className="flex items-center">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        <span>{activity.resource.stats.comments || 0}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {/* Optional: Only show last refresh time if auto-refresh is enabled */}
          {autoRefresh && (
            <div className="text-xs text-right text-gray-400 mt-3 opacity-70">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No recent activities found</p>
        </div>
      )}
      
      {/* Document viewer for viewing resources */}
      {showDocumentViewer && selectedResource && (
        <DocumentViewer
          fileUrl={selectedResource.fileUrl}
          fileName={selectedResource.fileName || selectedResource.title}
          onClose={() => setShowDocumentViewer(false)}
        />
      )}
    </div>
  );
};
