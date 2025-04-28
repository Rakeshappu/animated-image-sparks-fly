
import React, { useState, useEffect } from 'react';
import { activityService } from '../../services/activity.service';
import { Clock, Eye, Download, ThumbsUp, MessageSquare, Calendar, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DocumentViewer } from '../document/DocumentViewer';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface ActivityFeedProps {
  limit?: number;
  showTitle?: boolean;
  autoRefresh?: boolean;
  className?: string;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ 
  limit = 3, 
  showTitle = true, 
  autoRefresh = true,
  className = "" 
}) => {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDocViewer, setShowDocViewer] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const { user } = useAuth();

  // Function to format relative time
  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - activityTime.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) { 
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else {
      return activityTime.toLocaleDateString('en-US', { 
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  // Function to format actual time
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Function to fetch activities
  const fetchActivities = async () => {
    try {
      setLoading(true);
      const data = await activityService.getRecentActivities(limit);
      setActivities(data);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch activities on component mount
  useEffect(() => {
    fetchActivities();
    
    // Set up event listener for activity refreshes
    if (autoRefresh) {
      const handleActivitiesRefreshed = (e: Event) => {
        const customEvent = e as CustomEvent;
        if (customEvent.detail?.activities) {
          setActivities(customEvent.detail.activities);
        } else {
          fetchActivities();
        }
      };
      
      document.addEventListener('activitiesRefreshed', handleActivitiesRefreshed);
      
      return () => {
        document.removeEventListener('activitiesRefreshed', handleActivitiesRefreshed);
      };
    }
  }, [limit, autoRefresh]);

  // Function to handle viewing a document
  const handleViewDocument = (activity: any) => {
    if (!activity.resource) {
      toast.error('Resource not available');
      return;
    }

    if (activity.resource.fileUrl) {
      setSelectedDocument({
        fileUrl: activity.resource.fileUrl,
        fileName: activity.resource.fileName || activity.resource.title
      });
      setShowDocViewer(true);
    } else if (activity.resource.link) {
      window.open(activity.resource.link, '_blank');
    } else {
      toast.error('No content available to view');
    }
  };

  // Function to get icon based on activity type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'view':
        return <Eye className="h-4 w-4 text-blue-500" />;
      case 'download':
        return <Download className="h-4 w-4 text-green-500" />;
      case 'upload':
        return <ExternalLink className="h-4 w-4 text-indigo-500" />;
      case 'like':
        return <ThumbsUp className="h-4 w-4 text-red-500" />;
      case 'comment':
        return <MessageSquare className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm p-4 ${className}`}>
      {showTitle && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-800">Recent Activities</h3>
          <button 
            onClick={fetchActivities}
            className="text-xs text-indigo-600 hover:text-indigo-800"
          >
            Refresh
          </button>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-6 text-gray-500">No recent activities</div>
      ) : (
        <AnimatePresence>
          <div className="space-y-3">
            {activities.map((activity, index) => (
              <motion.div
                key={activity._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleViewDocument(activity)}
              >
                <div className="flex items-start space-x-3">
                  <div className="bg-gray-100 p-2 rounded-full">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800 line-clamp-1">
                      {activity.message || `${activity.type} a resource`}
                    </div>
                    
                    {activity.resource && (
                      <div className="mt-1 text-xs">
                        <span className="text-gray-600 font-medium">{activity.resource.title}</span>
                        {activity.resource.subject && (
                          <span className="text-gray-500"> in {activity.resource.subject}</span>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center mt-2 text-xs text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>{formatRelativeTime(activity.timestamp)}</span>
                      <span className="mx-1">at</span>
                      <span>{formatTime(activity.timestamp)}</span>
                    </div>
                    
                    {activity.resource && activity.resource.stats && (
                      <div className="flex items-center mt-1.5 space-x-3 text-xs text-gray-500">
                        <div className="flex items-center">
                          <Eye className="h-3 w-3 mr-1" />
                          <span>{activity.resource.stats.views || 0}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <Download className="h-3 w-3 mr-1" />
                          <span>{activity.resource.stats.downloads || 0}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          <span>{activity.resource.stats.likes || 0}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          <span>{activity.resource.stats.comments || 0}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
      
      {showDocViewer && selectedDocument && (
        <DocumentViewer 
          fileUrl={selectedDocument.fileUrl} 
          fileName={selectedDocument.fileName} 
          onClose={() => setShowDocViewer(false)}
        />
      )}
    </div>
  );
};
