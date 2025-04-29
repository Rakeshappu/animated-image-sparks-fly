import React, { useState, useEffect } from 'react';
import { AIResourceSearch } from '../../components/search/AIResourceSearch';
import { useAuth } from '../../contexts/AuthContext';
import { ResourceUpload } from '../../components/faculty/ResourceUpload';
import { UploadFormData } from '../../types/faculty';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { API_ROUTES } from '../../lib/api/routes';
import { getResources, deleteResource } from '../../services/resource.service';
import { 
  Briefcase, ChevronRight, Download, Link as LinkIcon, 
  FileText, Loader, Trash2, ThumbsUp, MessageSquare, Eye, 
  ExternalLink, Bookmark
} from 'lucide-react';
import { 
  placementCategories, 
  getStandardizedCategory, 
  getCategoryNameById 
} from '../../utils/placementCategoryUtils';
import { DocumentViewer } from '../../components/document/DocumentViewer';
import { activityService } from '../../services/activity.service';
import { motion } from 'framer-motion';

export const PlacementResourcesPage = () => {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [commentText, setCommentText] = useState<string>('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [submittingLike, setSubmittingLike] = useState(false);
  const [showDocViewer, setShowDocViewer] = useState(false);
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [openCommentResourceId, setOpenCommentResourceId] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({});
  const { user } = useAuth();

  useEffect(() => {
    fetchPlacementResources();
  }, []);

  const fetchPlacementResources = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching placement resources...');
      const response = await api.get(API_ROUTES.RESOURCES.LIST, {
        params: { category: 'placement' }
      });
      
      if (response.data && response.data.resources && Array.isArray(response.data.resources)) {
        setResources(response.data.resources);
        // Check bookmark status for each resource
        if (user) {
          checkBookmarkStatuses(response.data.resources);
        }
      } else {
        setResources([]);
      }
    } catch (error) {
      console.error('Error fetching placement resources:', error);
      toast.error('Failed to load placement resources');
      setResources([]);
    } finally {
      setIsLoading(false);
    }
  };

  const checkBookmarkStatuses = async (resources: any[]) => {
    const bookmarkStatuses: Record<string, boolean> = {};
    for (const resource of resources) {
      try {
        const response = await api.get(`/api/resources/${resource._id}/bookmark-status`);
        bookmarkStatuses[resource._id] = response.data.isBookmarked;
      } catch (error) {
        console.error('Failed to check bookmark status:', error);
      }
    }
    setBookmarks(bookmarkStatuses);
  };

  const handleUpload = async (data: UploadFormData) => {
    try {
      if (!selectedCategory) {
        toast.error('Please select a placement category first');
        return;
      }
      
      console.log('Uploading placement resource:', data);
      
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description || '');
      formData.append('type', data.type);
      formData.append('subject', `Placement - ${placementCategories.find(cat => cat.id === selectedCategory)?.name}`);
      formData.append('semester', '0'); // Placement resources are semester-agnostic
      formData.append('category', 'placement');
      formData.append('placementCategory', selectedCategory);
      
      if (data.file) {
        formData.append('file', data.file);
      }
      
      if (data.link) {
        formData.append('link', data.link);
      }
      
      console.log('Sending resource creation request');
      const response = await api.post(API_ROUTES.RESOURCES.PLACEMENT, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('Resource creation response:', response.data);
      toast.success('Placement resource uploaded successfully!');
      
      setShowUploadForm(false);
      setSelectedCategory(null);
      
      // Fetch updated resources after successful upload
      fetchPlacementResources();
    } catch (error) {
      console.error('Error uploading placement resource:', error);
      toast.error('Failed to upload placement resource. Please try again.');
    }
  };

  const handleDeleteResource = async (resourceId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this resource?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('Deleting resource with ID:', resourceId);
      
      await deleteResource(resourceId);
      
      toast.success('Resource deleted successfully');
      
      // Update the local state to remove the deleted resource
      setResources(resources.filter(r => r._id !== resourceId));
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast.error('Failed to delete resource');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLikeResource = async (resourceId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    if (!user) {
      toast.error('Please log in to like resources');
      return;
    }
    
    try {
      setSubmittingLike(true);
      
      // Find current like status
      const resource = resources.find(r => r._id === resourceId);
      const isCurrentlyLiked = resource?.likedBy?.some((id: string) => id === user._id);
      
      // We need to include the token in the headers
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/resources/${resourceId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ like: !isCurrentlyLiked })
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Like response:', data);
      
      toast.success(isCurrentlyLiked ? 'Like removed' : 'Resource liked!');
      
      // Update the resource in local state
      setResources(resources.map(r => 
        r._id === resourceId 
          ? { 
              ...r, 
              stats: { ...r.stats, likes: data.likesCount },
              likedBy: isCurrentlyLiked 
                ? r.likedBy.filter((id: string) => id !== user._id)
                : [...(r.likedBy || []), user._id]
            }
          : r
      ));
    } catch (error) {
      console.error('Error liking resource:', error);
      toast.error('Failed to like resource');
    } finally {
      setSubmittingLike(false);
    }
  };

  const handleBookmarkResource = async (resourceId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    if (!user) {
      toast.error('Please log in to bookmark resources');
      return;
    }
    
    try {
      const isCurrentlyBookmarked = bookmarks[resourceId] || false;
      
      // Update UI optimistically
      setBookmarks({
        ...bookmarks,
        [resourceId]: !isCurrentlyBookmarked
      });
      
      // We need to include the token in the headers
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/resources/${resourceId}/bookmark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Bookmark response:', data);
      
      toast.success(isCurrentlyBookmarked ? 'Bookmark removed' : 'Resource bookmarked!');
    } catch (error) {
      console.error('Error bookmarking resource:', error);
      toast.error('Failed to bookmark resource');
      
      // Revert UI on error
      if (resourceId) {
        setBookmarks({
          ...bookmarks,
          [resourceId]: !bookmarks[resourceId]
        });
      }
    }
  };

  const handleCommentSubmit = async (resourceId: string, e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!user) {
      toast.error('Please log in to comment');
      return;
    }
    
    if (!commentText.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }
    
    try {
      setSubmittingComment(true);
      
      // We need to include the token in the headers
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/resources/${resourceId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: commentText })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Comment response:', data);
      
      toast.success('Comment added!');
      setCommentText('');
      
      // Update the resource in local state
      setResources(resources.map(r => 
        r._id === resourceId 
          ? { 
              ...r, 
              comments: [...(r.comments || []), data.comment],
              stats: { ...r.stats, comments: (r.stats?.comments || 0) + 1 } 
            }
          : r
      ));
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const getCategoryResources = (categoryId: string) => {
    const standardizedId = getStandardizedCategory(categoryId);
    
    return resources.filter(resource => {
      // Check if the resource has the placementCategory property matching the category ID
      if (resource.placementCategory) {
        const resourceCategory = getStandardizedCategory(resource.placementCategory);
        return resourceCategory === standardizedId;
      }
      
      // Fallback: check if the subject contains the category name
      const categoryName = getCategoryNameById(categoryId);
      if (resource.subject && categoryName) {
        return resource.subject.toLowerCase().includes(categoryName.toLowerCase());
      }
      
      return false;
    });
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <div className="p-2 rounded-full bg-red-100 text-red-600"><FileText className="h-5 w-5" /></div>;
      case 'link':
        return <div className="p-2 rounded-full bg-blue-100 text-blue-600"><LinkIcon className="h-5 w-5" /></div>;
      default:
        return <div className="p-2 rounded-full bg-green-100 text-green-600"><FileText className="h-5 w-5" /></div>;
    }
  };

  const handleResourceClick = async (resource: any, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    // Get the resource ID
    const resourceId = resource._id;
    
    // Track resource view
    try {
      // Update view count
      await activityService.incrementResourceView(resourceId);
      
      // Update local state
      setResources(resources.map(r => {
        if (r._id === resourceId) {
          return {
            ...r,
            stats: {
              ...r.stats,
              views: (r.stats?.views || 0) + 1
            }
          };
        }
        return r;
      }));
    } catch (error) {
      console.error("Failed to update view count:", error);
    }
    
    // Handle resource based on type
    if (resource.type === 'link' && resource.link) {
      window.open(resource.link, '_blank');
    } else if (resource.fileUrl) {
      setSelectedResource(resource);
      setShowDocViewer(true);
    } else {
      toast.error('No content available for this resource');
    }
  };

  const toggleCommentSection = (resourceId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    setOpenCommentResourceId(openCommentResourceId === resourceId ? null : resourceId);
    setCommentText(''); // Clear comment text when toggling
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center dark:text-gray-200">
        <Briefcase className="mr-2 h-6 w-6 text-indigo-600" />
        Placement Preparation Resources
      </h1>

      {/* Category grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {placementCategories.map((category) => (
          <motion.div
            key={category.id}
            whileHover={{ y: -5 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSelectedCategory(category.id)}
            className="bg-white rounded-lg shadow-md p-5 cursor-pointer hover:shadow-lg transition-shadow border border-gray-100"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg text-indigo-700">{category.name}</h3>
                <p className="text-gray-600 text-sm mt-1">{category.description}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
            <div className="mt-4 text-xs text-gray-500">
              {getCategoryResources(category.id).length} {getCategoryResources(category.id).length === 1 ? 'resource' : 'resources'} available
            </div>
          </motion.div>
        ))}
      </div>

      {/* Selected category view */}
      {selectedCategory && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {getCategoryResources(selectedCategory).map((resource) => (
            <motion.div
              key={resource._id}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
              onClick={(e) => handleResourceClick(resource, e)}
            >
              {/* Resource content */}
              <div className="flex flex-col h-full">
                <div className="flex items-start mb-3">
                  {getResourceIcon(resource.type)}
                  <div className="ml-3 flex-1">
                    <h3 className="font-medium text-gray-800">{resource.title}</h3>
                    {resource.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{resource.description}</p>
                    )}
                  </div>
                </div>

                {/* Stats section */}
                <div className="mt-auto">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex space-x-4">
                      <span className="flex items-center">
                        <Eye className="h-4 w-4 mr-1" />
                        {resource.stats?.views || 0}
                      </span>
                      <span className="flex items-center">
                        <ThumbsUp className={`h-4 w-4 mr-1 ${resource.likedBy?.includes(user?._id) ? 'text-red-500' : ''}`} />
                        {resource.stats?.likes || 0}
                      </span>
                      <span className="flex items-center">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        {resource.stats?.comments || 0}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookmarkResource(resource._id);
                        }}
                        className="p-1 rounded hover:bg-gray-100"
                      >
                        <Bookmark 
                          className={`h-4 w-4 ${
                            bookmarks[resource._id] ? 'fill-yellow-500 text-yellow-500' : 'text-gray-400'
                          }`} 
                        />
                      </button>

                      {user?.role === 'faculty' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteResource(resource._id);
                          }}
                          className="p-1 rounded hover:bg-gray-100"
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Document viewer */}
      {showDocViewer && selectedResource && (
        <DocumentViewer
          fileUrl={selectedResource.fileUrl}
          fileName={selectedResource.fileName || selectedResource.title}
          onClose={() => setShowDocViewer(false)}
        />
      )}
    </div>
  );
};

export default PlacementResourcesPage;
