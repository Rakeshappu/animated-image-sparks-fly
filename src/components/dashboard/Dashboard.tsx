
import { useState, useEffect } from 'react';
import { BarChart2, Book, Clock } from 'lucide-react';
import { SearchBar } from '../search/SearchBar';
import { UserBanner } from '../user/UserBanner';
import { AnalyticsCard } from '../analytics/AnalyticsCard';
import { QuickAccess } from '../resources/QuickAccess';
import { ActivityFeed } from '../activities/ActivityFeed';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import Skeleton from '../ui/skeleton';
import { motion } from 'framer-motion';

interface RecentViewedResource {
  id: string;
  title: string;
  subject: string;
  fileUrl: string;
  viewedAt: string;
  viewCount: number;
}

export const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalResources: 0,
    totalViews: 0
  });
  const [recentViews, setRecentViews] = useState<RecentViewedResource[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        if (user?.semester) {
          // Fetch resources and stats for the user's semester
          const response = await api.get(`/api/resources/stats?semester=${user.semester}`);
          
          // Calculate total views from all resources of the current semester
          let semesterTotalViews = 0;
          
          // If we have resources array with stats data for the semester
          if (window.sharedResources && Array.isArray(window.sharedResources)) {
            // Filter resources for user's semester
            const semesterResources = window.sharedResources.filter(
              resource => resource.semester === user.semester
            );
            
            // Sum up views from all semester resources
            semesterTotalViews = semesterResources.reduce(
              (sum, resource) => sum + (resource.stats?.views || 0), 
              0
            );
          }
          
          setStats({
            totalResources: response.data.totalResources || 0,
            totalViews: semesterTotalViews || (
              response.data.dailyStats ? 
                response.data.dailyStats.reduce((sum: number, day: any) => sum + day.views, 0) : 0
            )
          });
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    const fetchRecentViews = async () => {
      try {
        if (!user?._id) return;
        
        const response = await api.get('/api/user/activity?type=view&limit=3');
        console.log('Fetched recent views:', response.data);
        
        if (response.data.activities && Array.isArray(response.data.activities)) {
          const recentViewsData = response.data.activities.map((activity: any) => ({
            id: activity.resource?._id || '',
            title: activity.resource?.title || 'Untitled Resource',
            subject: activity.resource?.subject || '',
            fileUrl: activity.resource?.fileUrl || '',
            viewedAt: activity.timestamp,
            viewCount: activity.resource?.stats?.views || 0
          }));
          
          setRecentViews(recentViewsData);
        }
      } catch (err) {
        console.error('Failed to fetch recent views:', err);
      }
    };
    
    if (user) {
      fetchDashboardData();
      fetchRecentViews();
      
      // Set up polling to refresh recent views every 30 seconds
      const intervalId = setInterval(fetchRecentViews, 30000);
      
      return () => {
        clearInterval(intervalId);
      };
    }
  }, [user]);

  const renderRecentViews = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-lg shadow p-4">
              <Skeleton className="h-4 w-3/4 mb-3" />
              <Skeleton className="h-3 w-1/2 mb-2" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          ))}
        </div>
      );
    }
    
    if (recentViews.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">You haven't viewed any resources yet.</p>
          <Link to="/study-materials" className="text-indigo-600 hover:text-indigo-800 mt-2 inline-block">
            Browse resources
          </Link>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recentViews.map((resource, index) => (
          <motion.div
            key={resource.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <Link 
              to={`/resources/${resource.id}`} 
              className="block p-4 h-full"
            >
              <h3 className="font-medium text-gray-800 mb-2 line-clamp-2">{resource.title}</h3>
              <div className="text-sm text-gray-500 mb-3">{resource.subject}</div>
              <div className="flex items-center text-xs text-gray-400">
                <Clock className="h-3 w-3 mr-1" />
                <span>
                  {new Date(resource.viewedAt).toLocaleDateString()} • {resource.viewCount} views
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900">
      <SearchBar />
      
      <div className="mt-8">
        <UserBanner />
      </div>

      <QuickAccess />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <AnalyticsCard
          title="Total Resources"
          value={stats.totalResources.toString()}
          change={loading ? "loading..." : ""}
          icon={<Book className="h-6 w-6 text-indigo-600" />}
        />
        <AnalyticsCard
          title="Total Views"
          value={stats.totalViews.toString()}
          change={loading ? "loading..." : ""}
          icon={<BarChart2 className="h-6 w-6 text-indigo-600" />}
        />
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center dark:text-gray-200">
          <Clock className="h-5 w-5 mr-2 text-indigo-600 " />
          Recently Viewed Resources
        </h2>
        {renderRecentViews()}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
};
