
import { useState, useEffect } from 'react';
import { BarChart2, Book } from 'lucide-react';
import { SearchBar } from '../search/SearchBar';
import { UserBanner } from '../user/UserBanner';
import { AnalyticsCard } from '../analytics/AnalyticsCard';
import { QuickAccess } from '../resources/QuickAccess';
import { ActivityFeed } from '../activities/ActivityFeed';
import { useAuth } from '../../contexts/AuthContext';
import { getResources } from '../../services/resource.service';

export const Dashboard = () => {
  const { user: currentUser } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalResources: 0,
    totalViews: 0
  });

  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        if (currentUser?.semester) {
          const fetchedResources = await getResources({ semester: currentUser.semester });
          
          if (Array.isArray(fetchedResources)) {
            setResources(fetchedResources);
            
            // Calculate semester-specific stats
            const totalResources = fetchedResources.length;
            const totalViews = fetchedResources.reduce((total, resource: any) => 
              total + (resource.stats?.views || 0), 0);
            
            setStats({
              totalResources,
              totalViews
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch resources:', err);
        setResources([]);
      } finally {
        setLoading(false);
      }
    };
    
    if (currentUser) {
      fetchResources();
    }
  }, [currentUser]);

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
          {loading ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <ActivityFeed />
          )}
        </div>
      </div>
    </div>
  );
};

