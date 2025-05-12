import React, { useState, useEffect } from 'react';
import { AIResourceSearch } from '../../components/search/AIResourceSearch';
import { useAuth } from '../../contexts/AuthContext';
import { ResourceUpload } from '../../components/faculty/ResourceUpload';
import { UploadFormData } from '../../types/faculty';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { API_ROUTES } from '../../lib/api/routes';
import { 
  Briefcase, ChevronRight, Download, Link as LinkIcon, ArrowLeft,
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

  // Animation variants
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
      formData.append('subject', `Placement - ${placementCategories.find((cat: any) => cat.id === selectedCategory)?.name}`);
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
      
      // Call API to delete the resource
      await api.delete(`/api/resources/${resourceId}`);
      
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
      
      // Optimistically update UI
      setResources(resources.map(r => 
        r._id === resourceId 
          ? { 
              ...r, 
              stats: { ...r.stats, likes: isCurrentlyLiked ? (r.stats?.likes || 1) - 1 : (r.stats?.likes || 0) + 1 },
              likedBy: isCurrentlyLiked 
                ? (r.likedBy || []).filter((id: string) => id !== user._id)
                : [...(r.likedBy || []), user._id]
            }
          : r
      ));
      
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
      
      // Update with actual server data
      setResources(resources.map(r => 
        r._id === resourceId 
          ? { 
              ...r, 
              stats: { ...r.stats, likes: data.likesCount }
            }
          : r
      ));
    } catch (error) {
      console.error('Error liking resource:', error);
      toast.error('Failed to like resource');
      
      // Revert optimistic update on error
      const resource = resources.find(r => r._id === resourceId);
      const isCurrentlyLiked = resource?.likedBy?.some((id: string) => id === user._id);
      
      setResources(resources.map(r => 
        r._id === resourceId 
          ? { 
              ...r, 
              stats: { ...r.stats, likes: isCurrentlyLiked ? (r.stats?.likes || 0) - 1 : (r.stats?.likes || 0) + 1 },
              likedBy: isCurrentlyLiked 
                ? (r.likedBy || []).filter((id: string) => id !== user._id)
                : [...(r.likedBy || []), user._id]
            }
          : r
      ));
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
      case "video":
        return <div className="p-2 rounded-full bg-red-100 text-red-600"><FileText className="h-5 w-5" /></div>;
      case "link":
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

  // If no category is selected, show the category grid
  if (!selectedCategory) {
    return (
      <motion.div
        className="p-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.h1 variants={itemVariants} className="text-2xl font-bold mb-6 flex items-center dark:text-gray-200">
          <Briefcase className="mr-2 h-6 w-6 text-indigo-600" />
          Placement Preparation Resources
        </motion.h1>

        {/* Category grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {placementCategories.map((category: any) => (
            <motion.div
              key={category.id}
              variants={itemVariants}
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

        {/* Document viewer */}
        {showDocViewer && selectedResource && (
          <DocumentViewer
            fileUrl={selectedResource.fileUrl}
            fileName={selectedResource.fileName || selectedResource.title}
            onClose={() => setShowDocViewer(false)}
          />
        )}
      </motion.div>
    );
  }

  // Show selected category resources
  return (
    <motion.div
      className="p-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants}>
        <button 
          onClick={() => setSelectedCategory(null)} 
          className="flex items-center text-indigo-600 hover:text-indigo-800 mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Categories
        </button>
        
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <span className="text-indigo-600 mr-2">{getCategoryNameById(selectedCategory)}</span> 
          Resources
        </h2>
      </motion.div>

      {/* Resource grid for the selected category */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {isLoading ? (
          // Loading placeholders
          [...Array(3)].map((_, index) => (
            <motion.div
              key={`loading-${index}`}
              variants={itemVariants}
              className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 animate-pulse"
            >
              <div className="flex items-start">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="ml-3 flex-1">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </motion.div>
          ))
        ) : getCategoryResources(selectedCategory).length > 0 ? (
          // Actual resources
          getCategoryResources(selectedCategory).map((resource) => (
            <motion.div
              key={resource._id}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
              variants={itemVariants}
              className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col"
              onClick={(e) => handleResourceClick(resource, e)}
            >
              {/* Resource content */}
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
                    <button
                      onClick={(e) => handleLikeResource(resource._id, e)}
                      className="flex items-center hover:text-red-500 transition-colors"
                    >
                      <ThumbsUp 
                        className={`h-4 w-4 mr-1 ${
                          resource.likedBy?.includes(user?._id) ? 'text-red-500 fill-red-500' : ''
                        }`} 
                      />
                      {resource.stats?.likes || 0}
                    </button>
                    <button 
                      onClick={(e) => toggleCommentSection(resource._id, e)}
                      className="flex items-center hover:text-blue-500 transition-colors"
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      {resource.stats?.comments || 0}
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => handleBookmarkResource(resource._id, e)}
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
                        onClick={(e) => handleDeleteResource(resource._id, e)}
                        className="p-1 rounded hover:bg-gray-100"
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Comment section - only shown when toggled */}
                {openCommentResourceId === resource._id && (
                  <div 
                    className="mt-4 pt-4 border-t border-gray-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Show existing comments */}
                    {resource.comments && resource.comments.length > 0 ? (
                      <div className="mb-3 max-h-32 overflow-y-auto">
                        {resource.comments.map((comment: any, idx: number) => (
                          <div key={idx} className="mb-2 text-sm">
                            <span className="font-medium">{comment.author?.name || 'User'}: </span>
                            <span className="text-gray-600">{comment.content}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 mb-3">No comments yet</p>
                    )}
                    
                    {/* Comment input */}
                    <form onSubmit={(e) => handleCommentSubmit(resource._id, e)} className="flex">
                      <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="flex-1 text-sm border border-gray-300 rounded-l-md px-3 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="Add a comment..."
                      />
                      <button
                        type="submit"
                        disabled={submittingComment}
                        className="bg-indigo-600 text-white rounded-r-md px-3 py-1 text-sm hover:bg-indigo-700 transition-colors"
                      >
                        {submittingComment ? 'Posting...' : 'Post'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        ) : (
          // No resources message
          <motion.div 
            variants={itemVariants} 
            className="col-span-3 p-8 bg-white rounded-lg shadow text-center"
          >
            <p className="text-gray-600">No resources available for this category yet.</p>
            {user?.role === 'faculty' && (
              <button
                onClick={() => setShowUploadForm(true)}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
              >
                Upload Resource
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* Document viewer */}
      {showDocViewer && selectedResource && (
        <DocumentViewer
          fileUrl={selectedResource.fileUrl}
          fileName={selectedResource.fileName || selectedResource.title}
          onClose={() => setShowDocViewer(false)}
        />
      )}

      {/* Upload form modal */}
      {showUploadForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Upload {getCategoryNameById(selectedCategory)} Resource</h2>
            <ResourceUpload 
              onSubmit={handleUpload} 
              onCancel={() => setShowUploadForm(false)} 
              resourceType="placement"
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default PlacementResourcesPage;
