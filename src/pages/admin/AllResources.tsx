import { useState, useEffect } from 'react';
import { 
  FileText, Search, Filter, ChevronDown, Upload, Download, Trash2, ThumbsUp, 
  MessageSquare, Eye, Video, Link as LinkIcon, File, Pencil, BarChart2, Clock, Calendar,
  Check, X, ExternalLink, CircleSlash
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { formatDate } from '../../utils/dateUtils';
import { FacultyResource } from '../../types/faculty';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';

interface ResourceStats {
  views: number;
  likes: number;
  comments: number;
  downloads: number;
}

interface AllResourcesProps {
  onViewAnalytics?: (resourceId: string) => void;
}

interface ApiResource {
  _id: string;
  title: string;
  description: string;
  type: string;
  subject: string;
  semester: number;
  createdAt: string;
  fileName?: string;
  fileUrl?: string;
  uploadedBy?: {
    fullName: string;
    _id: string;
  };
  department?: string;
  stats?: {
    views: number;
    likes: number;
    comments?: Array<any>;
    downloads: number;
    lastViewed?: string;
  }
}

const AllResources = ({ onViewAnalytics }: AllResourcesProps) => {
  const [resources, setResources] = useState<FacultyResource[]>([]);
  const [filteredResources, setFilteredResources] = useState<FacultyResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'document' | 'video' | 'note' | 'link'>('all');
  const [semesterFilter, setSemesterFilter] = useState<number | 'all'>('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'views' | 'likes' | 'downloads'>('date');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();

  // Define transition variants for animations
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

  // Fetch resources data
  useEffect(() => {
    const fetchResources = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/api/resources');
        
        if (response.data && response.data.resources) {
          const formattedResources: FacultyResource[] = response.data.resources.map((res: ApiResource) => ({
            id: res._id,
            title: res.title,
            description: res.description,
            type: res.type,
            subject: res.subject,
            semester: res.semester,
            uploadDate: res.createdAt,
            createdAt: res.createdAt,
            fileName: res.fileName,
            fileUrl: res.fileUrl,
            uploadedByName: res.uploadedBy?.fullName || 'Unknown',
            uploaderId: res.uploadedBy?._id,
            department: res.department || '',
            stats: {
              views: res.stats?.views || 0,
              likes: res.stats?.likes || 0,
              comments: res.stats?.comments?.length || 0,
              downloads: res.stats?.downloads || 0,
              lastViewed: res.stats?.lastViewed || new Date().toISOString()
            }
          }));
          
          setResources(formattedResources);
          setFilteredResources(formattedResources);
          
          // Extract unique subjects
          const subjects = Array.from(new Set(
            formattedResources.map(res => res.subject).filter(Boolean)
          )) as string[];
          
          setAvailableSubjects(subjects);
        }
      } catch (error) {
        console.error('Error fetching resources:', error);
        toast.error('Failed to load resources data');
        
        if (window.sharedResources && window.sharedResources.length > 0) {
          setResources([...window.sharedResources]);
          setFilteredResources([...window.sharedResources]);
          
          const subjects = Array.from(new Set(
            window.sharedResources.map(res => res.subject).filter(Boolean)
          )) as string[];
          
          setAvailableSubjects(subjects);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchResources();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...resources];
    
    // Apply search term filter
    if (searchTerm) {
      filtered = filtered.filter(resource => 
        resource.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.subject.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(resource => resource.type === typeFilter);
    }
    
    // Apply semester filter
    if (semesterFilter !== 'all') {
      filtered = filtered.filter(resource => resource.semester === semesterFilter);
    }
    
    // Apply subject filter
    if (subjectFilter !== 'all') {
      filtered = filtered.filter(resource => resource.subject === subjectFilter);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'views':
          return (b.stats?.views || 0) - (a.stats?.views || 0);
        case 'likes':
          return (b.stats?.likes || 0) - (a.stats?.likes || 0);
        case 'downloads':
          return (b.stats?.downloads || 0) - (a.stats?.downloads || 0);
        default:
          return new Date(b.uploadDate || Date.now()).getTime() - 
                new Date(a.uploadDate || Date.now()).getTime();
      }
    });
    
    setFilteredResources(filtered);
  }, [resources, searchTerm, typeFilter, semesterFilter, subjectFilter, sortBy]);

  // Handle resource actions
  const handleDeleteResource = async () => {
    if (!resourceToDelete) {
      return;
    }
    
    setIsDeleting(true);
    
    try {
      await api.delete(`/api/resources/${resourceToDelete}`);
      
      // Update local state
      setResources(resources.filter(resource => resource.id !== resourceToDelete));
      toast.success('Resource deleted successfully');
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast.error('Failed to delete resource');
    } finally {
      setIsDeleting(false);
      setResourceToDelete(null);
      setShowDeleteDialog(false);
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-6 w-6 text-red-500" />;
      case 'link':
        return <LinkIcon className="h-6 w-6 text-blue-500" />;
      case 'note':
        return <Pencil className="h-6 w-6 text-yellow-500" />;
      default:
        return <FileText className="h-6 w-6 text-green-500" />;
    }
  };

  const getResourceTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div 
          className="flex items-center mb-6"
          variants={itemVariants}
        >
          <FileText className="mr-2 text-indigo-500" size={24} />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">All Resources</h1>
        </motion.div>

        {/* Filters and Search */}
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-5"
          variants={itemVariants}
        >
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="pl-10 pr-4 py-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Search resources by title, description, or subject"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
              >
                <option value="all">All Types</option>
                <option value="document">Document</option>
                <option value="video">Video</option>
                <option value="note">Note</option>
                <option value="link">Link</option>
              </select>
              <select
                className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              >
                <option value="all">All Semesters</option>
                {Array.from({ length: 8 }, (_, i) => i + 1).map((sem) => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
              <select
                className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
              >
                <option value="all">All Subjects</option>
                {availableSubjects.map((subject, index) => (
                  <option key={index} value={subject}>{subject}</option>
                ))}
              </select>
              <select
                className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'views' | 'likes' | 'downloads')}
              >
                <option value="date">Most Recent</option>
                <option value="views">Most Viewed</option>
                <option value="likes">Most Liked</option>
                <option value="downloads">Most Downloaded</option>
              </select>
              <button
                className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
                onClick={() => window.location.href = '/admin/upload'}
              >
                <Upload size={16} className="mr-1" />
                Upload New
              </button>
            </div>
          </div>
          
          {/* Resource count summary */}
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredResources.length} of {resources.length} resources
            </div>
          </div>
        </motion.div>
        
        {/* Resource Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
        >
          {filteredResources.length === 0 ? (
            <div className="col-span-full p-8 text-center bg-white dark:bg-gray-800 rounded-lg shadow">
              <p className="text-gray-500 dark:text-gray-400">No resources found matching your criteria.</p>
            </div>
          ) : (
            filteredResources.map((resource) => (
              <motion.div
                key={resource.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden"
                variants={itemVariants}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${
                        resource.type === 'video' ? 'bg-red-100 dark:bg-red-900' :
                        resource.type === 'link' ? 'bg-blue-100 dark:bg-blue-900' :
                        resource.type === 'note' ? 'bg-yellow-100 dark:bg-yellow-900' :
                        'bg-green-100 dark:bg-green-900'
                      }`}>
                        {getResourceIcon(resource.type)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
                          {resource.title}
                        </h3>
                        <div className="flex items-center mt-1 text-sm text-gray-600 dark:text-gray-400">
                          <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-0.5 rounded text-xs">
                            {getResourceTypeLabel(resource.type)}
                          </span>
                          <span className="mx-2">•</span>
                          <span>{formatDate(resource.uploadDate)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <p className="mt-3 text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                    {resource.description}
                  </p>
                  
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900 px-2.5 py-0.5 text-xs text-blue-800 dark:text-blue-200">
                      Sem {resource.semester}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-purple-100 dark:bg-purple-900 px-2.5 py-0.5 text-xs text-purple-800 dark:text-purple-200">
                      {resource.subject}
                    </span>
                  </div>
                  
                  <div className="mt-4 border-t border-gray-100 dark:border-gray-700 pt-4">
                    <div className="grid grid-cols-4 gap-2">
                      <div className="flex flex-col items-center">
                        <Eye className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">{resource.stats?.views || 0}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <ThumbsUp className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">{resource.stats?.likes || 0}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <MessageSquare className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">{resource.stats?.comments || 0}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <Download className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">{resource.stats?.downloads || 0}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-between">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Uploaded by: {resource.uploadedBy || 'Unknown'}
                    </div>
                    <div className="flex space-x-2">
                      {onViewAnalytics && (
                        <button 
                          onClick={() => onViewAnalytics(resource.id)}
                          className="p-1 text-indigo-600 hover:text-indigo-800 dark:hover:text-indigo-400"
                        >
                          <BarChart2 size={18} />
                        </button>
                      )}
                      {resource.fileUrl && (
                        <a 
                          href={resource.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-blue-600 hover:text-blue-800 dark:hover:text-blue-400"
                        >
                          <ExternalLink size={18} />
                        </a>
                      )}
                      <button 
                        onClick={() => {
                          setResourceToDelete(resource.id);
                          setShowDeleteDialog(true);
                        }}
                        className="p-1 text-red-600 hover:text-red-800 dark:hover:text-red-400"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
        
        {/* Stats Summary */}
        {resources.length > 0 && (
          <motion.div 
            className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-5"
            variants={itemVariants}
          >
            {[
              {
                title: 'Total Resources',
                value: resources.length,
                icon: <FileText className="h-6 w-6 text-indigo-600" />
              },
              {
                title: 'Documents',
                value: resources.filter(r => r.type === 'document').length,
                icon: <File className="h-6 w-6 text-green-600" />
              },
              {
                title: 'Videos',
                value: resources.filter(r => r.type === 'video').length,
                icon: <Video className="h-6 w-6 text-red-600" />
              },
              {
                title: 'Total Views',
                value: resources.reduce((sum, r) => sum + (r.stats?.views || 0), 0),
                icon: <Eye className="h-6 w-6 text-blue-600" />
              }
            ].map((stat, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg"
              >
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 rounded-md p-3 bg-indigo-100 dark:bg-indigo-900">
                      {stat.icon}
                    </div>
                    <div className="ml-5">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {stat.title}
                      </dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
                        {stat.value}
                      </dd>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        title="Delete Resource"
        message="Are you sure you want to delete this resource? This action cannot be undone."
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
        onConfirm={handleDeleteResource}
        onCancel={() => {
          setShowDeleteDialog(false);
          setResourceToDelete(null);
        }}
        isProcessing={isDeleting}
      />
    </div>
  );
};

export default AllResources;
