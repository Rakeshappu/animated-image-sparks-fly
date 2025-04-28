
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
      
      console.log('Placement resources response:', response.data);
      
      if (response.data && response.data.resources && Array.isArray(response.data.resources)) {
        setResources(response.data.resources);
        
        // Check bookmark status for each resource
        if (user) {
          const bookmarkStatuses: Record<string, boolean> = {};
          
          for (const resource of response.data.resources) {
            try {
              const token = localStorage.getItem('token');
              const bookmarkResponse = await fetch(`/api/resources/${resource._id}/bookmark-status`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              if (bookmarkResponse.ok) {
                const data = await bookmarkResponse.json();
                bookmarkStatuses[resource._id] = data.isBookmarked;
              }
            } catch (error) {
              console.error('Failed to check bookmark status:', error);
            }
          }
          
          setBookmarks(bookmarkStatuses);
        }
      } else {
        setResources([]);
        console.error('Unexpected resource format:', response.data);
      }
    } catch (error) {
      console.error('Error fetching placement resources:', error);
      toast.error('Failed to load placement resources');
      setResources([]);
    } finally {
      setIsLoading(false);
    }
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
      
      <div className="mb-8">
        <p className="text-gray-700 mb-6 dark:text-gray-400">
          Access comprehensive placement preparation resources organized by categories. These materials can help you prepare for technical interviews, improve your resume, and enhance your soft skills.
        </p>
        
        {user && user.role === 'faculty' && (
          <div className="mb-6">
            {!showUploadForm && !selectedCategory ? (
              <button
                onClick={() => setShowUploadForm(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                Upload Placement Resource
              </button>
            ) : null}
          </div>
        )}
        
        {showUploadForm && !selectedCategory && (
          <div className="mb-6">
            <button
              onClick={() => setShowUploadForm(false)}
              className="mb-4 text-indigo-600 hover:text-indigo-700 flex items-center"
            >
              ← Back to Resources
            </button>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Select a Placement Category</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {placementCategories.map(category => (
                  <div 
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-indigo-50 cursor-pointer transition-colors"
                  >
                    <h3 className="font-medium text-indigo-600">{category.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {showUploadForm && selectedCategory && (
          <div className="mb-6">
            <button
              onClick={() => {
                setSelectedCategory(null);
              }}
              className="mb-4 text-indigo-600 hover:text-indigo-700 flex items-center"
            >
              ← Back to Categories
            </button>
            <ResourceUpload 
              onUpload={handleUpload} 
              initialSubject={`Placement - ${placementCategories.find(cat => cat.id === selectedCategory)?.name}`}
              initialSemester={0} // Placement resources are semester-agnostic
              initialCategory="placement"
              isPlacementResource={true}
              placementCategory={selectedCategory} 
            />
          </div>
        )}
        
        {!showUploadForm && !selectedCategory && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {placementCategories.map((category) => {
                const categoryResources = getCategoryResources(category.id);
                return (
                  <div
                    key={category.id}
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
                      {categoryResources.length} {categoryResources.length === 1 ? 'resource' : 'resources'} available
                    </div>
                  </div>
                );
              })}
            </div>
            
            <AIResourceSearch initialSearchType="placement" />
          </>
        )}
        
        {!showUploadForm && selectedCategory && (
          <div>
            <button
              onClick={() => setSelectedCategory(null)}
              className="mb-6 text-indigo-600 hover:text-indigo-700 flex items-center"
            >
              ← Back to All Categories
            </button>
            
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                {placementCategories.find(cat => cat.id === selectedCategory)?.name} Resources
              </h2>
              {user && user.role === 'faculty' && (
                <button
                  onClick={() => {
                    setShowUploadForm(true);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm"
                >
                  Add {placementCategories.find(cat => cat.id === selectedCategory)?.name} Resource
                </button>
              )}
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader className="h-8 w-8 text-indigo-600 animate-spin" />
                <span className="ml-2 text-gray-600">Loading resources...</span>
              </div>
            ) : (
              <>
                {getCategoryResources(selectedCategory).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getCategoryResources(selectedCategory).map((resource) => (
                      <motion.div
                        key={resource._id}
                        whileHover={{ y: -5 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={(e) => handleResourceClick(resource, e)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start">
                            {getResourceIcon(resource.type)}
                            <div className="ml-4 flex-1">
                              <h3 className="font-medium text-indigo-700 line-clamp-2">{resource.title}</h3>
                              <p className="text-gray-600 text-sm mt-1 line-clamp-2">{resource.description}</p>
                              
                              <div className="flex flex-wrap mt-3 text-xs space-x-2">
                                <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full capitalize">
                                  {resource.type}
                                </span>
                              </div>
                              
                              <div className="mt-3 flex items-center space-x-3 text-xs text-gray-500">
                                <div className="flex items-center">
                                  <Eye className="h-3 w-3 mr-1" />
                                  <span>{resource.stats?.views || 0}</span>
                                </div>
                                
                                <div className="flex items-center">
                                  <ThumbsUp className="h-3 w-3 mr-1" />
                                  <span>{resource.stats?.likes || 0}</span>
                                </div>
                                
                                <div className="flex items-center">
                                  <MessageSquare className="h-3 w-3 mr-1" />
                                  <span>{resource.stats?.comments || 0}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-end mt-3 space-x-2">
                          {resource.fileUrl && (
                            <button 
                              onClick={(e) => handleResourceClick(resource, e)}
                              className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs flex items-center"
                            >
                              <FileText className="h-3 w-3 mr-1" /> View
                            </button>
                          )}
                          
                          {resource.link && (
                            <a 
                              href={resource.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs flex items-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" /> Link
                            </a>
                          )}
                          
                          <button
                            onClick={(e) => handleBookmarkResource(resource._id, e)}
                            className={`${bookmarks[resource._id] ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'} px-2 py-1 rounded text-xs flex items-center`}
                          >
                            <Bookmark className={`h-3 w-3 mr-1 ${bookmarks[resource._id] ? 'fill-yellow-500' : ''}`} />
                            {bookmarks[resource._id] ? 'Saved' : 'Save'}
                          </button>
                          
                          <button
                            onClick={(e) => handleLikeResource(resource._id, e)}
                            className={`${resource.likedBy?.includes(user?._id) ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'} px-2 py-1 rounded text-xs flex items-center`}
                          >
                            <ThumbsUp className={`h-3 w-3 mr-1 ${resource.likedBy?.includes(user?._id) ? 'fill-red-500' : ''}`} />
                            {resource.likedBy?.includes(user?._id) ? 'Liked' : 'Like'}
                          </button>
                          
                          <button
                            onClick={(e) => toggleCommentSection(resource._id, e)}
                            className={`${openCommentResourceId === resource._id ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'} px-2 py-1 rounded text-xs flex items-center`}
                          >
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Comment
                          </button>
                          
                          {user && user.role === 'faculty' && (
                            <button 
                              onClick={(e) => handleDeleteResource(resource._id, e)}
                              className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs flex items-center"
                              title="Delete resource"
                            >
                              <Trash2 className="h-3 w-3 mr-1" /> Delete
                            </button>
                          )}
                        </div>
                        
                        {/* Comment section */}
                        {openCommentResourceId === resource._id && (
                          <div className="mt-4 border-t border-gray-100 pt-3" onClick={(e) => e.stopPropagation()}>
                            <h4 className="text-xs font-medium mb-2">Comments</h4>
                            
                            {resource.comments && resource.comments.length > 0 ? (
                              <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                                {resource.comments.map((comment: any, index: number) => (
                                  <div key={comment._id || index} className="text-xs p-2 bg-gray-50 rounded">
                                    <div className="font-medium text-xs text-gray-700">
                                      {comment.author?.name || "User"} • {new Date(comment.createdAt).toLocaleDateString()}
                                    </div>
                                    <div className="text-gray-700">{comment.content}</div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-500 mb-2">No comments yet</p>
                            )}
                            
                            <form onSubmit={(e) => handleCommentSubmit(resource._id, e)} className="flex">
                              <input
                                type="text"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Add a comment..."
                                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-l focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <button
                                type="submit"
                                disabled={submittingComment}
                                className="bg-indigo-600 text-white px-2 py-1 text-xs rounded-r hover:bg-indigo-700 disabled:opacity-50"
                              >
                                {submittingComment ? '...' : 'Post'}
                              </button>
                            </form>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <p className="text-gray-500">No resources found for this category</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        
        {showDocViewer && selectedResource && (
          <DocumentViewer
            fileUrl={selectedResource.fileUrl}
            fileName={selectedResource.fileName || selectedResource.title}
            onClose={() => setShowDocViewer(false)}
          />
        )}
      </div>
    </div>
  );
};

export default PlacementResourcesPage;
