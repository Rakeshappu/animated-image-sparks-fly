import { useState, useEffect } from 'react';
import { ResourceUpload } from '../../components/faculty/ResourceUpload';
import { ResourceList } from '../../components/faculty/ResourceList';
import { UploadFormData, FacultyResource } from '../../types/faculty';
import { UploadWorkflow } from '../../components/faculty/UploadWorkflow';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import checkDatabaseConnection  from '../../services/resource.service';
import { MongoDBStatusBanner } from '../../components/auth/MongoDBStatusBanner';
import { API_ROUTES } from '../../lib/api/routes';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// Animation variants for transitions
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

// Initialize window global variables - use consistent type declarations
declare global {
  interface Window {
    sharedResources?: FacultyResource[];
    subjectFolders?: any[];
  }
}

// Initialize global variables if running in browser
if (typeof window !== 'undefined') {
  window.sharedResources = window.sharedResources || [];
  window.subjectFolders = window.subjectFolders || [];
}

export const FacultyDashboard = () => {
  const [resources, setResources] = useState<FacultyResource[]>(
    typeof window !== 'undefined' && window.sharedResources ? [...window.sharedResources] : []
  );
  const [selectedResource, setSelectedResource] = useState<FacultyResource | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showUploadWorkflow, setShowUploadWorkflow] = useState(false);
  const [showResourceUpload, setShowResourceUpload] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const status = await checkDatabaseConnection();
        setDbStatus(status);
        console.log('MongoDB connection status:', status);
      } catch (err) {
        console.error('Failed to check DB connection:', err);
      }
    };
    
    checkConnection();
  }, []);
  const fetchResources = async () => {
    try {
      setIsLoading(true);
      // Use the faculty-specific endpoint which only returns resources uploaded by the current faculty
      const response = await api.get('/api/resources/faculty');
      console.log('Fetched faculty resources from DB:', response.data);
      
      const resourcesData = response.data.resources || response.data || [];
      
      const formattedResources = Array.isArray(resourcesData) 
        ? resourcesData.map((res: any) => ({
            id: res._id,
            title: res.title,
            description: res.description,
            type: res.type,
            subject: res.subject,
            semester: res.semester,
            uploadDate: res.createdAt,
            fileName: res.fileName,
            fileUrl: res.fileUrl,
            category: res.category,
            stats: {
              views: res.stats?.views || 0,
              likes: res.stats?.likes || 0,
              comments: res.stats?.comments || 0,
              downloads: res.stats?.downloads || 0,
              lastViewed: res.stats?.lastViewed || new Date().toISOString()
            }
          }))
        : [];
      
      setResources(formattedResources);
      
      if (typeof window !== 'undefined') {
        window.sharedResources = formattedResources;
      }
    } catch (err) {
      console.error('Error fetching resources:', err);
      
      if (window.sharedResources && window.sharedResources.length > 0) {
        setResources([...window.sharedResources]);
      } else {
        setResources([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    
    fetchResources();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    
    const fetchSubjectFolders = async () => {
      try {
        const response = await api.get('/api/subject-folders');
        
        if (typeof response.data === 'string' && response.data.includes('<!doctype html>')) {
          console.error('Received HTML instead of JSON for subject folders');
          return;
        }
        
        console.log('Fetched subject folders:', response.data);
        
        if (response.data.folders && Array.isArray(response.data.folders)) {
          if (typeof window !== 'undefined') {
            window.subjectFolders = response.data.folders;
          }
        }
      } catch (err) {
        console.error('Error fetching subject folders:', err);
      }
    };
    
    fetchSubjectFolders();
  }, [user]);

  const handleUpload = async (data: UploadFormData) => {
    try {
      setIsLoading(true);
      console.log('Uploading resource:', data);
      
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description || '');
      formData.append('type', data.type);
      formData.append('subject', data.subject);
      
      // Use selected semester if available, otherwise use the one from data
      const semesterToUse = selectedSemester !== null ? selectedSemester : (data.semester || 1);
      formData.append('semester', semesterToUse.toString());
      
      if (data.file) {
        formData.append('file', data.file);
      }
      
      if (data.link) {
        formData.append('link', data.link);
      }

      if (data.category) {
        formData.append('category', data.category);
      }

      if (data.placementCategory) {
        formData.append('placementCategory', data.placementCategory);
      }
      
      const response = await api.post(API_ROUTES.RESOURCES.CREATE, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('Resource created:', response.data);
      
      const newResource: FacultyResource = {
        id: response.data.resource._id,
        title: response.data.resource.title,
        description: response.data.resource.description,
        type: response.data.resource.type, 
        subject: response.data.resource.subject,
        semester: response.data.resource.semester,
        uploadDate: response.data.resource.createdAt,
        fileUrl: response.data.resource.fileUrl,
        fileName: data.file?.name,
        category: response.data.resource.category,
        placementCategory: response.data.resource.placementCategory,
        stats: {
          views: 0,
          likes: 0,
          comments: 0,
          downloads: 0
        }
      };
      
      setResources(prev => [newResource, ...prev]);
      if (typeof window !== 'undefined') {
        if (window.sharedResources) {
          window.sharedResources = [newResource, ...window.sharedResources];
        } else {
          window.sharedResources = [newResource];
        }
      }
      
      // Send notifications to students about the new resource
      if (user && response.data.resource._id) {
        try {
          // Send notification through API endpoint
          await api.post('/api/notifications/resource-uploaded', {
            resourceId: response.data.resource._id,
            facultyName: user.fullName
          });
          console.log('Notification sent to students about new resource');
        } catch (notifyError) {
          console.error('Failed to send notification:', notifyError);
        }
      }
      
      toast.success('Resource uploaded successfully!');
      setShowResourceUpload(false);
      setSelectedSemester(null); // Reset selected semester after successful upload
    } catch (error) {
      console.error('Error uploading resource:', error);
      toast.error('Failed to upload resource. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewAnalytics = (resourceId: string) => {
    console.log('Viewing analytics for resource:', resourceId);
    navigate('/faculty/analytics', { state: { resourceId } });
  };

  const handleStartUpload = () => {
    setShowUploadWorkflow(true);
  };

  const handleSelectUploadOption = async (option: string, data?: any) => {
    if (option === 'direct-upload') {
      // Save selected semester from workflow to pass to resource upload
      if (data && data.semester) {
        setSelectedSemester(data.semester);
      }
      setShowResourceUpload(true);
      setShowUploadWorkflow(false);
    } else if (option === 'create-subject-folders') {
      console.log('Creating subject folders:', data);
      
      try {
        const response = await api.post('/api/subject-folders', {
          subjects: data.subjects
        });
        
        console.log('Subject folders created:', response.data);
        toast.success(`Created ${response.data.folders.length} subject folders!`);
        
        if (typeof window !== 'undefined') {
          if (!window.subjectFolders) {
            window.subjectFolders = [];
          }
          
          if (data && data.subjects) {
            window.subjectFolders = [
              ...window.subjectFolders,
              ...response.data.folders
            ];
          }
        }
        
        // Save selected semester for resource upload
        if (data && data.semester) {
          setSelectedSemester(data.semester);
        }
        
        setShowUploadWorkflow(false);
        setShowResourceUpload(true);
      } catch (err: any) {
        console.error('Error creating subject folders:', err);
        toast.error(err.message || 'Failed to create subject folders. Please try again.');
      }
    } else {
      setShowUploadWorkflow(false);
      setShowResourceUpload(true);
    }
  };

  if (isLoading && resources.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {dbStatus && <MongoDBStatusBanner status={dbStatus} />}
      
      <AnimatePresence mode="wait">
        {!showUploadWorkflow && !showResourceUpload && !showAnalytics && (
          <motion.div
            key="dashboard"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={containerVariants}
            className="space-y-8"
          >
            <motion.div 
              variants={itemVariants}
              className="flex justify-end mb-6"
            >
              <button
                onClick={handleStartUpload}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
              >
                Upload Content
              </button>
            </motion.div>
            
            <ResourceList 
              resources={resources} 
              onViewAnalytics={handleViewAnalytics}
              showDeleteButton={true}
              onResourceDeleted={fetchResources}
            />
          </motion.div>
        )}
        
        {showUploadWorkflow && (
          <motion.div
            key="upload-workflow"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={containerVariants}
          >
            <UploadWorkflow 
              onSelectOption={handleSelectUploadOption} 
              onCancel={() => setShowUploadWorkflow(false)} 
              showAvailableSubjects={true}
            />
          </motion.div>
        )}
        
        {showResourceUpload && (
          <motion.div
            key="resource-upload"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={containerVariants}
          >
            <motion.button
              variants={itemVariants}
              onClick={() => {
                setShowResourceUpload(false);
                setSelectedSemester(null); // Reset selected semester when canceling
              }}
              className="mb-4 text-indigo-600 hover:text-indigo-700 flex items-center space-x-2 transition-colors duration-200"
            >
              <span>← Back to Resources</span>
            </motion.button>
            <ResourceUpload 
              onUpload={handleUpload} 
              initialSubject={selectedResource?.subject}
              initialSemester={selectedSemester !== null ? selectedSemester : selectedResource?.semester}
            />
          </motion.div>
        )}
        
        {showAnalytics && selectedResource && (
          <motion.div
            key="analytics"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={containerVariants}
          >
            <motion.button
              variants={itemVariants}
              onClick={() => setShowAnalytics(false)}
              className="mb-4 text-indigo-600 hover:text-indigo-700 flex items-center space-x-2 transition-colors duration-200"
            >
              <span>← Back to Resources</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FacultyDashboard;
