
import { useState } from 'react';
import { FileText, Video, Link as LinkIcon, BarChart2, Eye, ThumbsUp, MessageSquare, Trash2 } from 'lucide-react';
import { FacultyResource } from '../../types/faculty.ts';
import { formatDate } from '../../utils/dateUtils.ts';
import { toast } from 'react-hot-toast';
import { ConfirmationDialog } from '../ui/ConfirmationDialog.ts';
import { useNavigate } from 'react-router-dom';

interface ResourceListProps {
  resources: FacultyResource[];
  onViewAnalytics: (resourceId: string) => void;
  showDeleteButton?: boolean;
  onResourceDeleted?: () => void;
}

type FilterOption = 'all' | 'document' | 'video' | 'note' | 'link';
type SortOption = 'date' | 'views' | 'likes' | 'comments';

declare global {
  interface Window {
    sharedResources: FacultyResource[];
  }
}

export const ResourceList = ({ resources, onViewAnalytics, showDeleteButton = false, onResourceDeleted }: ResourceListProps) => {
  const [filterType, setFilterType] = useState<FilterOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [selectedSemester, setSelectedSemester] = useState<number | 'all'>('all');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<string | null>(null);
  const navigate = useNavigate();

  const getIcon = (type: FacultyResource['type']) => {
    switch (type) {
      case 'video':
        return <Video className="h-5 w-5" />;
      case 'link':
        return <LinkIcon className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const handleDeletePrompt = (resourceId: string) => {
    if (!resourceId) {
      toast.error('Invalid resource ID');
      return;
    }
    
    setResourceToDelete(resourceId);
    setShowDeleteConfirmation(true);
  };

  const handleDeleteResource = async () => {
    if (!resourceToDelete) {
      toast.error('Invalid resource ID');
      setShowDeleteConfirmation(false);
      return;
    }
    
    try {
      setIsDeleting(true);
      setDeletingId(resourceToDelete);
      console.log('Deleting resource with ID:', resourceToDelete);
      
      // Call the API directly with fetch for more reliable execution
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`/api/resources/${resourceToDelete}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Delete failed with status: ${response.status}`);
      }
      
      console.log('Delete successful');
      
      // Update the shared resources to reflect deletion - ensure we check both ID formats
      if (window.sharedResources) {
        window.sharedResources = window.sharedResources.filter(r => 
          (r.id !== resourceToDelete) && (r._id !== resourceToDelete)
        );
      }
      
      // Show success message
      toast.success('Resource deleted successfully');
      
      // Notify parent component if needed
      if (onResourceDeleted) {
        onResourceDeleted();
      }
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast.error('Failed to delete resource');
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
      setShowDeleteConfirmation(false);
      setResourceToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirmation(false);
    setResourceToDelete(null);
  };

  const handleViewAnalytics = (resourceId: string) => {
    // Navigate directly to the analytics page with the selected resource
    navigate(`/faculty/analytics?resourceId=${resourceId}`);
  };

  // Define filteredResources here
  const filteredResources = resources
    .filter((resource) => filterType === 'all' || resource.type === filterType)
    .filter((resource) => selectedSemester === 'all' || resource.semester === selectedSemester || 
      (typeof resource.semester === 'string' && parseInt(resource.semester) === selectedSemester))
    .sort((a, b) => {
      switch (sortBy) {
        case 'views':
          return (b.stats?.views || 0) - (a.stats?.views || 0);
        case 'likes':
          return (b.stats?.likes || 0) - (a.stats?.likes || 0);
        case 'comments':
          return (b.stats?.comments || 0) - (a.stats?.comments || 0);
        default:
          return new Date(b.uploadDate || b.createdAt || Date.now()).getTime() - 
                 new Date(a.uploadDate || a.createdAt || Date.now()).getTime();
      }
    });

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <h2 className="text-xl font-semibold text-gray-800">Your Resources</h2>
        
        <div className="flex flex-wrap gap-4">
          <select
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            value={selectedSemester === 'all' ? 'all' : selectedSemester.toString()}
            onChange={(e) => setSelectedSemester(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
          >
            <option value="all">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
              <option key={sem} value={sem}>Semester {sem}</option>
            ))}
          </select>

          <select
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilterOption)}
          >
            <option value="all">All Types</option>
            <option value="document">Documents</option>
            <option value="video">Videos</option>
            <option value="note">Notes</option>
            <option value="link">Links</option>
          </select>

          <select
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
          >
            <option value="date">Most Recent</option>
            <option value="views">Most Viewed</option>
            <option value="likes">Most Liked</option>
            <option value="comments">Most Comments</option>
          </select>
        </div>
      </div>

      {filteredResources.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No resources found. Upload some resources to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredResources.map((resource) => (
            <div
              key={resource.id || resource._id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-lg ${
                    resource.type === 'video' ? 'bg-red-100 text-red-600' :
                    resource.type === 'link' ? 'bg-blue-100 text-blue-600' :
                    'bg-green-100 text-green-600'
                  }`}>
                    {getIcon(resource.type)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{resource.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <span>Semester {resource.semester}</span>
                      <span>{resource.subject}</span>
                      <span>{formatDate(resource.uploadDate || resource.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {showDeleteButton && (
                    <button
                      onClick={() => handleDeletePrompt(resource.id || resource._id || '')}
                      disabled={isDeleting && deletingId === (resource.id || resource._id)}
                      className="flex items-center space-x-1 text-red-600 hover:text-red-700 disabled:opacity-50 cursor-pointer"
                      type="button"
                    >
                      {isDeleting && deletingId === (resource.id || resource._id) ? (
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></span>
                      ) : (
                        <Trash2 className="h-5 w-5" />
                      )}
                      <span className="text-sm">Delete</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleViewAnalytics(resource.id || resource._id || '')}
                    className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-700 cursor-pointer"
                    type="button"
                  >
                    <BarChart2 className="h-5 w-5" />
                    <span className="text-sm">Analytics</span>
                  </button>
                </div>
              </div>

              <div className="mt-4 flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Eye className="h-4 w-4" />
                  <span>{resource.stats?.views || 0} views</span>
                </div>
                <div className="flex items-center space-x-1">
                  <ThumbsUp className="h-4 w-4" />
                  <span>{resource.stats?.likes || 0} likes</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>{resource.stats?.comments || 0} comments</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmationDialog
        isOpen={showDeleteConfirmation}
        title="Delete Resource"
        message="Are you sure you want to delete this resource? This action cannot be undone."
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
        onConfirm={handleDeleteResource}
        onCancel={handleCancelDelete}
        isProcessing={isDeleting}
      />
    </div>
  );
};
