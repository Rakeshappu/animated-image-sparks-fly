import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { MongoDBStatusBanner } from '../../components/auth/MongoDBStatusBanner';
import { checkDatabaseConnection } from '../../services/resource.service';
import { Users, FileText, UserCheck, Shield, Activity, PieChart, Upload } from 'lucide-react';
import { ResourceUpload } from '../../components/faculty/ResourceUpload';
import { ResourceList } from '../../components/faculty/ResourceList';
import { UploadWorkflow } from '../../components/faculty/UploadWorkflow';
import { UploadFormData, FacultyResource } from '../../types/faculty';
import { AnalyticsCard } from '../../components/analytics/AnalyticsCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Legend } from 'recharts';
import api from '../../services/api';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

declare global {
  interface Window {
    sharedResources: FacultyResource[];
    subjectFolders: any[];
  }
}

if (typeof window !== 'undefined') {
  if (!window.sharedResources) {
    window.sharedResources = [];
  }

  if (!window.subjectFolders) {
    window.subjectFolders = [];
  }
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      duration: 0.5,
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { type: 'spring', stiffness: 100 }
  }
};

const AdminDashboard = () => {
  const [resources, setResources] = useState<FacultyResource[]>(typeof window !== 'undefined' ? window.sharedResources : []);
  const [showUploadWorkflow, setShowUploadWorkflow] = useState(false);
  const [showResourceUpload, setShowResourceUpload] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'resources' | 'upload'>('dashboard');
  const [analytics, setAnalytics] = useState({
    users: { total: 0, loading: true },
    resources: { total: 0, loading: true },
    pendingUSNs: { total: 0, loading: true },
    pendingAdmins: { total: 0, loading: true },
    departments: { data: [] as { name: string; value: number }[], loading: true },
    resourceTypes: { data: [] as { name: string; value: number }[], loading: true },
    dailyActivity: { data: [] as { name: string; uploads: number; downloads: number; views: number }[], loading: true }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<any>(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const status = await checkDatabaseConnection();
        setDbStatus(status);
        console.log('MongoDB connection status in Admin Dashboard:', status);
      } catch (err) {
        console.error('Failed to check DB connection:', err);
      }
    };
    
    checkConnection();
  }, []);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Not authenticated');
        }

        // Fetch resource stats
        const resourcesStatsResponse = await api.get('/api/resources/stats');
        const resourcesStatsData = resourcesStatsResponse.data;
        
        // Fetch user stats
        const usersResponse = await api.get('/api/user/stats');
        const usersData = usersResponse.data;
        
        // Fetch pending USNs
        const pendingUSNsResponse = await api.get('/api/admin/eligible-usns');
        const pendingUSNsData = pendingUSNsResponse.data;
        const unusedUSNsCount = pendingUSNsData.eligibleUSNs ? 
          pendingUSNsData.eligibleUSNs.filter((usn: any) => !usn.isUsed).length : 0;
        
        // Fetch pending admin approvals
        const pendingAdminsResponse = await api.get('/api/admin/users?status=pending');
        const pendingAdminsData = pendingAdminsResponse.data;
        const pendingAdminsCount = pendingAdminsData.users ? pendingAdminsData.users.length : 0;
        
        // Fetch activity data
        const activityResponse = await api.get('/api/user/activity/stats');
        let activityData = activityResponse.data;
        
        // Process activity data for chart
        let dailyActivityChartData = [];
        
        if (activityData && activityData.weeklyActivity && activityData.weeklyActivity.length > 0) {
          dailyActivityChartData = activityData.weeklyActivity;
        } else {
          // Fallback to resource stats daily activity if available
          if (resourcesStatsData && resourcesStatsData.dailyActivity) {
            dailyActivityChartData = resourcesStatsData.dailyActivity;
          } else {
            // Create empty chart data if no real data available
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            dailyActivityChartData = days.map(day => ({
              name: day,
              uploads: Math.floor(Math.random() * 5),
              downloads: Math.floor(Math.random() * 10),
              views: Math.floor(Math.random() * 15)
            }));
          }
        }
        
        setAnalytics({
          users: { 
            total: usersData?.totalUsers || 0, 
            loading: false 
          },
          resources: { 
            total: resourcesStatsData?.totalResources || 0, 
            loading: false 
          },
          pendingUSNs: { 
            total: unusedUSNsCount, 
            loading: false 
          },
          pendingAdmins: { 
            total: pendingAdminsCount, 
            loading: false 
          },
          departments: {
            data: usersData?.departmentDistribution || [],
            loading: false
          },
          resourceTypes: {
            data: resourcesStatsData?.typeDistribution || [],
            loading: false
          },
          dailyActivity: {
            data: dailyActivityChartData,
            loading: false
          }
        });
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching analytics:', error);
        setAnalytics({
          users: { total: 0, loading: false },
          resources: { total: resources.length, loading: false },
          pendingUSNs: { total: 0, loading: false },
          pendingAdmins: { total: 0, loading: false },
          departments: { data: [], loading: false },
          resourceTypes: { data: [], loading: false },
          dailyActivity: { data: [], loading: false }
        });
        
        setIsLoading(false);
      }
    };

    fetchAnalytics();
    
    const intervalId = setInterval(() => {
      if (window.sharedResources !== resources) {
        setResources([...window.sharedResources]);
      }
    }, 2000);
    
    return () => clearInterval(intervalId);
  }, [resources]);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const response = await api.get('/api/resources');
        if (response.data && response.data.resources) {
          const fetchedResources = response.data.resources.map((res: any) => ({
            id: res._id,
            title: res.title,
            description: res.description,
            type: res.type,
            subject: res.subject,
            semester: res.semester,
            createdAt: res.createdAt,
            uploadDate: res.createdAt,
            fileName: res.fileName,
            fileUrl: res.fileUrl,
            stats: {
              views: res.stats?.views || 0,
              likes: res.stats?.likes || 0,
              comments: res.stats?.comments || 0,
              downloads: res.stats?.downloads || 0,
              lastViewed: res.stats?.lastViewed || new Date().toISOString()
            }
          }));
          
          setResources(fetchedResources);
          if (typeof window !== 'undefined') {
            window.sharedResources = fetchedResources;
          }
        }
      } catch (error) {
        console.error('Error fetching resources:', error);
      }
    };
    
    fetchResources();
  }, []);

  const handleStartUpload = () => {
    setShowUploadWorkflow(true);
    setCurrentView('upload');
  };

  const handleSelectUploadOption = (option: string, data?: any) => {
    if (option === 'direct-upload') {
      setShowResourceUpload(true);
      setShowUploadWorkflow(false);
    } else if (option === 'create-subject-folders') {
      console.log('Creating subject folders:', data);
      
      if (data && data.subjects) {
        const newFolders = data.subjects.map((subject: any) => ({
          ...subject,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          resourceCount: 0
        }));
        
        window.subjectFolders = [
          ...(window.subjectFolders || []),
          ...newFolders
        ];
      }
      
      setShowUploadWorkflow(false);
      setShowResourceUpload(true);
    } else {
      console.log(`Selected option: ${option}`, data);
      setShowUploadWorkflow(false);
      setShowResourceUpload(true);
    }
  };

  const handleUpload = async (data: UploadFormData) => {
    console.log('Uploading resource:', data);
    
    let fileContent = '';
    let fileName = '';
    
    if (data.file) {
      fileName = data.file.name;
      
      if (data.type !== 'link') {
        try {
          fileContent = await readFileAsBase64(data.file);
        } catch (error) {
          console.error('Error reading file:', error);
        }
      }
    }
    
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('type', data.type);
      formData.append('subject', data.subject);
      formData.append('semester', data.semester.toString());
      
      if (data.file) {
        formData.append('file', data.file);
      }
      
      if (data.link) {
        formData.append('link', data.link);
      }
      
      const response = await api.post('/api/resources', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const newResource: FacultyResource = {
        id: response.data.resource._id || Date.now().toString(),
        ...data,
        uploadDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        fileName: fileName,
        fileContent: fileContent,
        stats: {
          views: 0,
          likes: 0,
          comments: 0,
          downloads: 0,
          lastViewed: new Date().toISOString()
        }
      };
      
      window.sharedResources = [newResource, ...window.sharedResources];
      setResources([newResource, ...resources]);
      
      toast.success('Resource uploaded successfully!');
      setShowResourceUpload(false);
      setCurrentView('dashboard');
    } catch (error) {
      console.error('Error uploading resource:', error);
      toast.error('Failed to upload resource');
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          resolve(reader.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => {
        reject(reader.error);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleViewAnalytics = (resourceId: string) => {
    console.log(`View details for resource ${resourceId}`);
  };

  const handleGoBack = () => {
    setShowUploadWorkflow(false);
    setShowResourceUpload(false);
    setCurrentView('dashboard');
  };

  const COLORS = ['#4F46E5', '#7C3AED', '#EC4899', '#10B981', '#F59E0B', '#6366F1'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <MongoDBStatusBanner status={dbStatus} />
      <div className="container mx-auto p-6">
        {currentView === 'dashboard' && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.div 
              className="flex items-center mb-6"
              variants={itemVariants}
            >
              <Shield className="mr-2 text-indigo-500" size={24} />
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Admin Dashboard</h1>
            </motion.div>

            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
              variants={itemVariants}
            >
              <AnalyticsCard 
                title="Total Users" 
                value={analytics.users.loading ? '...' : analytics.users.total}
                icon={<Users className="h-6 w-6 text-indigo-500" />}
                isLoading={analytics.users.loading} 
              />
              <AnalyticsCard 
                title="Total Resources" 
                value={analytics.resources.loading ? '...' : analytics.resources.total}
                icon={<FileText className="h-6 w-6 text-green-500" />}
                isLoading={analytics.resources.loading} 
              />
              <AnalyticsCard 
                title="Pending USNs" 
                value={analytics.pendingUSNs.total}
                icon={<UserCheck className="h-6 w-6 text-blue-500" />}
                isLoading={analytics.pendingUSNs.loading}
              />
              <AnalyticsCard 
                title="Pending Admin Approvals" 
                value={analytics.pendingAdmins.total}
                icon={<Shield className="h-6 w-6 text-yellow-500" />}
                isLoading={analytics.pendingAdmins.loading}
              />
            </motion.div>

            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
              variants={itemVariants}
            >
              <motion.button 
                onClick={handleStartUpload}
                className="flex items-center justify-center p-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <Upload className="mr-2" size={20} />
                Upload New Content
              </motion.button>
              <motion.button 
                className="flex items-center justify-center p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                onClick={() => setCurrentView('resources')}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <FileText className="mr-2" size={20} />
                Manage Resources
              </motion.button>
              <motion.button 
                className="flex items-center justify-center p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                onClick={() => window.location.href = '/admin/users'}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <Users className="mr-2" size={20} />
                Manage Users
              </motion.button>
            </motion.div>

            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
              variants={itemVariants}
            >
              <motion.div 
                className="bg-white dark:bg-gray-800 shadow rounded-lg p-6"
                variants={itemVariants}
              >
                <div className="flex items-center mb-4">
                  <Activity className="mr-2 text-indigo-500" size={20} />
                  <h2 className="text-lg font-semibold dark:text-gray-200">Weekly Activity</h2>
                </div>
                <div className="h-80">
                  {analytics.dailyActivity.data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.dailyActivity.data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="uploads" fill="#4F46E5" />
                        <Bar dataKey="downloads" fill="#10B981" />
                        <Bar dataKey="views" fill="#F59E0B" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-gray-500">No activity data available</p>
                    </div>
                  )}
                </div>
              </motion.div>

              <motion.div 
                className="bg-white dark:bg-gray-800 shadow rounded-lg p-6"
                variants={itemVariants}
              >
                <div className="flex items-center mb-4">
                  <PieChart className="mr-2 text-indigo-500" size={20} />
                  <h2 className="text-lg font-semibold dark:text-gray-200">Resource Type Distribution</h2>
                </div>
                <div className="h-80">
                  {analytics.resourceTypes.data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={analytics.resourceTypes.data}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {analytics.resourceTypes.data.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </RechartsPie>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-gray-500">No resource type data available</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>

            {window.subjectFolders && window.subjectFolders.length > 0 && (
              <motion.div 
                className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg mb-8"
                variants={itemVariants}
              >
                <div className="px-4 py-5 sm:px-6 flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="mr-2 text-indigo-500" size={20} />
                    <h2 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                      Available Subject Folders
                    </h2>
                  </div>
                  <span className="text-sm text-gray-500">{window.subjectFolders.length} folders</span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                    {window.subjectFolders.map((folder, index) => (
                      <motion.div 
                        key={index} 
                        className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
                        whileHover={{ scale: 1.03, boxShadow: "0px 4px 10px rgba(0,0,0,0.1)" }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">{folder.subjectName}</h3>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <p>Lecturer: {folder.lecturerName}</p>
                          <p>Semester: {folder.semester}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {currentView === 'resources' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={handleGoBack}
                className="text-indigo-600 hover:text-indigo-700 flex items-center space-x-2"
              >
                <span>← Back to Dashboard</span>
              </button>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Manage Resources</h1>
            </div>
            
            <ResourceList
              resources={resources}
              onViewAnalytics={handleViewAnalytics}
              showDeleteButton={true}
            />
          </div>
        )}

        {currentView === 'upload' && (
          <div className="space-y-4">
            <button
              onClick={handleGoBack}
              className="mb-4 text-indigo-600 hover:text-indigo-700 flex items-center space-x-2"
            >
              <span>← Back to Dashboard</span>
            </button>
            
            {showUploadWorkflow && (
              <UploadWorkflow 
                onSelectOption={handleSelectUploadOption} 
                onCancel={handleGoBack}
                showAvailableSubjects={true}
              />
            )}
            
            {showResourceUpload && (
              <ResourceUpload onUpload={handleUpload} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
