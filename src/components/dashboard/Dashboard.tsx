
import { useState, useEffect } from 'react';
import { BarChart2, Book, Clock } from 'lucide-react';
import { SearchBar } from '../search/SearchBar';
import { UserBanner } from '../user/UserBanner';
import { AnalyticsCard } from '../analytics/AnalyticsCard';
import { QuickAccess } from '../resources/QuickAccess';
import { ActivityFeed } from '../user/ActivityFeed';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import Skeleton from '../ui/skeleton';
import { motion } from 'framer-motion';
import { LocalSearch } from '../search/LocalSearch';

export const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalResources: 0,
    totalViews: 0
  });
  const [resources, setResources] = useState<any[]>([]);
  const [filteredResources, setFilteredResources] = useState<any[]>([]);

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
            
            // Set the resources for local search
            setResources(window.sharedResources);
            setFilteredResources(window.sharedResources);
            
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
    
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Handle search results
  const handleSearchResults = (results: any[]) => {
    setFilteredResources(results);
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900">
      <div className="mb-6">
        <LocalSearch 
          resources={resources} 
          onSearchResults={handleSearchResults} 
          placeholder="Search through your semester resources..."
        />
      </div>
      
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

      {/* Make Activity Feed take full width */}
      <div className="w-full">
        <ActivityFeed limit={3} showTitle={true} autoRefresh={true} />
      </div>
    </div>
  );
};
