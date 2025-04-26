
import { useState, useEffect } from 'react';
import { BarChart2, Book } from 'lucide-react';
import { SearchBar } from '../search/SearchBar';
import { UserBanner } from '../user/UserBanner';
import { AnalyticsCard } from '../analytics/AnalyticsCard';
import { QuickAccess } from '../resources/QuickAccess';
import { ActivityFeed } from '../activities/ActivityFeed';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalResources: 0,
    totalViews: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);

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
                response.data.dailyStats.reduce((sum, day) => sum + day.views, 0) : 0
            )
          });

          // Fetch recent activities
          try {
            const activitiesResponse = await api.get('/api/user/activity?limit=5');
            if (activitiesResponse.data && activitiesResponse.data.activities) {
              setRecentActivities(activitiesResponse.data.activities);
            } else {
              console.error('Invalid activities response format:', activitiesResponse.data);
            }
          } catch (activityErr) {
            console.error('Failed to fetch user activities:', activityErr);
          }
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ActivityFeed activities={recentActivities} />
        </div>
      </div>
    </div>
  );
};
