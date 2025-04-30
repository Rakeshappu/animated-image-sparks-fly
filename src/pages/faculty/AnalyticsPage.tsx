
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ResourceAnalyticsView } from '../../components/faculty/ResourceAnalytics';
import { useSearchParams } from 'react-router-dom';
import { activityService } from '../../services/activity.service';

export interface ResourceAnalytics {
  views: number;
  likes: number;
  comments: number;
  downloads: number;
  lastViewed: string;
  dailyViews: Array<{ date: string; count: number }>;
  studentFeedback?: Array<{ rating: number; count: number }>;
}

interface Resource {
  id?: string;
  _id?: string;
  title: string;
  description: string;
  type: 'document' | 'video' | 'link' | 'note';
  url?: string;
  fileSize?: number;
  semester: number;
  subject: string;
  uploadDate?: string;
  analytics?: ResourceAnalytics;
  stats?: {
    views: number;
    likes: number;
    downloads: number;
    comments: number;
  };
}

interface ActivityData {
  name: string;
  uploads: number;
  downloads: number;
  views: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState<string>('');
  const [resourceAnalytics, setResourceAnalytics] = useState<ResourceAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedResourceTitle, setSelectedResourceTitle] = useState<string>('');
  const [weeklyActivity, setWeeklyActivity] = useState<ActivityData[]>([]);
  
  // Add this to get resourceId from URL params
  const resourceIdFromUrl = searchParams.get('resourceId');

  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        
        // Fetch faculty resources
        const resourceResponse = await api.get('/api/resources/faculty');
        
        // Fetch weekly activity data
        const weeklyActivityData = await activityService.getWeeklyActivities(false);
        setWeeklyActivity(weeklyActivityData);
        
        if (resourceResponse.data && resourceResponse.data.resources) {
          setResources(resourceResponse.data.resources);
          
          // Set selected resource from URL if available
          if (resourceIdFromUrl) {
            setSelectedResourceId(resourceIdFromUrl);
            // Find the title for the selected resource
            const selectedResource = resourceResponse.data.resources.find(
              (r: Resource) => r.id === resourceIdFromUrl || r._id === resourceIdFromUrl
            );
            if (selectedResource) {
              setSelectedResourceTitle(selectedResource.title);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching resources and analytics:', error);
        toast.error('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchResources();
  }, [resourceIdFromUrl]);
  
  useEffect(() => {
    if (selectedResourceId) {
      fetchResourceAnalytics(selectedResourceId);
    }
  }, [selectedResourceId]);
  
  const fetchResourceAnalytics = async (resourceId: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/api/resources/${resourceId}/analytics`);
      
      if (response.data) {
        // Update URL with the selected resource ID
        setSearchParams({ resourceId });
        
        setResourceAnalytics({
          views: response.data.views || 0,
          likes: response.data.likes || 0,
          comments: response.data.comments || 0,
          downloads: response.data.downloads || 0,
          lastViewed: response.data.lastViewed || new Date().toISOString(),
          dailyViews: response.data.dailyViews || [],
          studentFeedback: response.data.studentFeedback || []
        });
        
        // Find the title for the selected resource
        const selectedResource = resources.find(
          (r) => r.id === resourceId || r._id === resourceId
        );
        if (selectedResource) {
          setSelectedResourceTitle(selectedResource.title);
        }
      }
    } catch (error) {
      console.error('Error fetching resource analytics:', error);
      toast.error('Failed to load resource analytics');
    } finally {
      setLoading(false);
    }
  };
  
  const handleResourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const resourceId = e.target.value;
    setSelectedResourceId(resourceId);
  };
  
  // Calculate totals from all resources with proper stats handling
  const totalViews = resources.reduce((sum, resource) => 
    sum + ((resource.stats?.views || resource.analytics?.views) || 0), 0);
  const totalLikes = resources.reduce((sum, resource) => 
    sum + ((resource.stats?.likes || resource.analytics?.likes) || 0), 0);
  const totalComments = resources.reduce((sum, resource) => 
    sum + ((resource.stats?.comments || resource.analytics?.comments) || 0), 0);
  const totalDownloads = resources.reduce((sum, resource) => 
    sum + ((resource.stats?.downloads || resource.analytics?.downloads) || 0), 0);
  
  // Prepare data for the content distribution chart
  const contentTypeData = [
    { name: 'Documents', value: resources.filter(r => r.type === 'document').length },
    { name: 'Videos', value: resources.filter(r => r.type === 'video').length },
    { name: 'Links', value: resources.filter(r => r.type === 'link').length },
    { name: 'Notes', value: resources.filter(r => r.type === 'note').length }
  ].filter(item => item.value > 0);

  // Data for overall engagement metrics
  const engagementData = [
    { name: 'Views', value: totalViews },
    { name: 'Likes', value: totalLikes },
    { name: 'Comments', value: totalComments },
    { name: 'Downloads', value: totalDownloads }
  ];
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 dark:text-gray-200">Content Analytics</h1>
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Resource Analytics</h2>
        <div className="mb-6">
          <label htmlFor="resourceSelect" className="block text-sm font-medium text-gray-700 mb-2">
            Select Resource to View Analytics:
          </label>
          <select
            id="resourceSelect"
            className="block w-full max-w-lg rounded-md border border-gray-300 py-2 px-3 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            value={selectedResourceId}
            onChange={handleResourceChange}
          >
            <option value="">Select a resource...</option>
            {resources.map((resource) => (
              <option key={resource.id || resource._id} value={resource.id || resource._id}>
                {resource.title} (Semester {resource.semester}, {resource.subject})
              </option>
            ))}
          </select>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : selectedResourceId && resourceAnalytics ? (
          <ResourceAnalyticsView 
            analytics={resourceAnalytics} 
            resourceTitle={selectedResourceTitle}
            resourceId={selectedResourceId}
          />
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Select a resource to view detailed analytics</p>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Content Uploaded" value={resources.length} icon="📚" color="bg-blue-50" />
        <StatCard title="Total Views" value={totalViews} icon="👁️" color="bg-green-50" />
        <StatCard title="Total Likes" value={totalLikes} icon="👍" color="bg-yellow-50" />
        <StatCard title="Total Downloads" value={totalDownloads} icon="📥" color="bg-purple-50" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Content Type Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={contentTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {contentTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} resources`, 'Count']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Activity Over Past Week</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={weeklyActivity}
                margin={{ top: 10, right: 30, left: 20, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => {
                    // Capitalize first letter of series name for tooltip
                    const seriesName = name.charAt(0).toUpperCase() + name.slice(1);
                    return [`${value}`, seriesName];
                  }} 
                />
                <Bar dataKey="views" name="Views" fill="#8884d8" />
                <Bar dataKey="downloads" name="Downloads" fill="#82ca9d" />
                <Bar dataKey="uploads" name="Uploads" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div> */}
         <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Overall Engagement</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={engagementData}
              margin={{ top: 10, right: 30, left: 20, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value}`, 'Count']} />
              <Bar dataKey="value" fill="#8884d8">
                {engagementData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      </div>
      
     
    </div>
  );
}

const StatCard = ({ title, value, icon, color = 'bg-blue-50' }: { title: string; value: number; icon: string; color?: string }) => {
  return (
    <div className={`${color} p-4 rounded-lg`}>
      <div className="flex items-center">
        <div className="text-2xl mr-3">{icon}</div>
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-2xl font-semibold text-gray-800">{value}</p>
        </div>
      </div>
    </div>
  );
};
