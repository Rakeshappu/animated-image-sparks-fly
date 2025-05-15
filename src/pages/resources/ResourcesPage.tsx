
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts';
import { DownloadCloud, Upload, Users, FileText, Loader } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

// Type definitions
interface ResourceStat {
  totalResources: number;
  totalViews: number;
  totalLikes: number;
  totalDownloads: number;
  typeDistribution: { name: string; value: number }[];
  dailyActivity: {
    name: string;
    date: string;
    uploads: number;
    downloads: number;
    views: number;
  }[];
  todayStats: {
    uploads: number;
    downloads: number;
    views: number;
  };
}

export const ResourcesPage = () => {
  const [stats, setStats] = useState<ResourceStat | null>(null);
  const [loading, setLoading] = useState(true);

  // Colors for the pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/resources/stats');
        
        if (response.data) {
          setStats(response.data);
        }
      } catch (error) {
        console.error('Error fetching resource stats:', error);
        toast.error('Failed to load resource statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
        Resource Statistics
      </h1>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <div className="rounded-full bg-purple-100 dark:bg-purple-900 p-3 mb-4">
              <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-3xl font-bold text-center">{stats?.totalResources || 0}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center">Total Resources</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-3 mb-4">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-center">{stats?.totalViews || 0}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center">Total Views</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <div className="rounded-full bg-red-100 dark:bg-red-900 p-3 mb-4">
              <DownloadCloud className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="text-3xl font-bold text-center">{stats?.totalDownloads || 0}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center">Total Downloads</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <div className="rounded-full bg-green-100 dark:bg-green-900 p-3 mb-4">
              <Upload className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-3xl font-bold text-center">{stats?.todayStats?.uploads || 0}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center">Uploads Today</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Resource Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Resource Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.typeDistribution || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {stats?.typeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Daily Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats?.dailyActivity || []}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="views" fill="#8884d8" name="Views" />
                  <Bar dataKey="downloads" fill="#82ca9d" name="Downloads" />
                  <Bar dataKey="uploads" fill="#ffc658" name="Uploads" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Resource Engagement Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={stats?.dailyActivity || []}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line 
                    yAxisId="left" 
                    type="monotone" 
                    dataKey="views" 
                    stroke="#8884d8" 
                    activeDot={{ r: 8 }} 
                    name="Views" 
                  />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="downloads" 
                    stroke="#82ca9d" 
                    name="Downloads" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResourcesPage;
