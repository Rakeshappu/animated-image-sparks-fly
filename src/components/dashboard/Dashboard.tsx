
import { useState, useEffect } from 'react';
import { BarChart2, Book } from 'lucide-react';
import { UserBanner } from '../user/UserBanner';
import { AnalyticsCard } from '../analytics/AnalyticsCard';
import { QuickAccess } from '../resources/QuickAccess';
import { ActivityFeed } from '../user/ActivityFeed';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { LocalSearch } from '../search/LocalSearch';
import { FacultyResource } from '../../types/faculty';

export const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalResources: 0,
    totalViews: 0
  });
  const [resources, setResources] = useState<FacultyResource[]>([]);
  const [filteredResources, setFilteredResources] = useState<FacultyResource[]>([]);
  const [searchResults, setSearchResults] = useState<FacultyResource[]>([]);
  const [searchPerformed, setSearchPerformed] = useState(false);

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
          if (typeof window !== 'undefined' && window.sharedResources && Array.isArray(window.sharedResources)) {
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
  const handleSearchResults = (results: FacultyResource[]) => {
    setSearchResults(results);
    setSearchPerformed(results.length > 0 || results.length === 0);
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
      
      {searchPerformed && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Search Results</h2>
          {searchResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((resource) => (
                <div 
                  key={resource.id || resource._id}
                  className="bg-white p-4 rounded-lg shadow"
                >
                  <h3 className="font-medium text-indigo-600">{resource.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{resource.description}</p>
                  <div className="flex items-center mt-2 text-xs text-gray-500">
                    <span className="mr-3 capitalize">{resource.type}</span>
                    <span className="mr-3">{resource.subject}</span>
                    <span>Semester {resource.semester}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <p className="text-gray-600">No resources found matching your search.</p>
            </div>
          )}
        </div>
      )}
      
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

      {/* Activity Feed takes full width */}
      <div className="w-full">
        <ActivityFeed limit={3} showTitle={true} autoRefresh={true} />
      </div>
    </div>
  );
};
