
import { useState, useEffect } from 'react';
import { FileText, Video, Link as LinkIcon, Eye, Download, Clock, ThumbsUp, MessageSquare, Bookmark, Send } from 'lucide-react';
import { FacultyResource } from '../../types/faculty';
import { DocumentViewer } from '../document/DocumentViewer';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

interface ResourceItemProps {
  resource: FacultyResource;
  onLikeUpdate?: (resourceId: string, isLiked: boolean, likesCount: number) => void;
}

export const ResourceItem = ({ resource, onLikeUpdate }: ResourceItemProps) => {
  const [showDocViewer, setShowDocViewer] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [likesCount, setLikesCount] = useState(resource.stats?.likes || 0);
  const { user } = useAuth();
  const resourceId = resource.id || resource._id;
  
  // Check if resource is liked and bookmarked on component mount
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!user) return;
      
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        // Check like status
        const likeResponse = await fetch(`/api/resources/${resourceId}/like-status`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (likeResponse.ok) {
          const likeData = await likeResponse.json();
          setIsLiked(likeData.isLiked);
        }
        
        // Check bookmark status
        const bookmarkResponse = await fetch(`/api/resources/${resourceId}/bookmark-status`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (bookmarkResponse.ok) {
          const bookmarkData = await bookmarkResponse.json();
          setIsBookmarked(bookmarkData.isBookmarked);
        }
      } catch (error) {
        console.error('Error checking resource status:', error);
      }
    };
    
    checkLikeStatus();
  }, [resource, user, resourceId]);
  
  const getIcon = () => {
    switch (resource.type) {
      case 'document':
        return <FileText className="h-5 w-5 text-red-600" />;
      case 'video':
        return <Video className="h-5 w-5 text-blue-600" />;
      case 'link':
        return <LinkIcon className="h-5 w-5 text-green-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };
  
  const handleResourceOpen = async () => {
    // Update view count
    if (resourceId) {
      await updateResourceStats('view');
    }
    
    // Show document viewer
    setShowDocViewer(true);
  };
  
  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    
    try {
      // Update both view and download stats
      if (resourceId) {
        await updateResourceStats('view');
        await updateResourceStats('download');
      }
      
      if (resource.fileUrl) {
        // Direct download - don't show document viewer
        const a = document.createElement('a');
        a.href = resource.fileUrl;
        a.download = resource.fileName || resource.title || 'download';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else if (resource.type === 'link' && resource.link) {
        // If it's a link resource, open the link
        window.open(resource.link, '_blank');
      } else {
        toast.error('No file or link available for download');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download resource');
    }
  };
  
  const handleView = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    
    // Update view count
    if (resourceId) {
      await updateResourceStats('view');
    }
    
    // Show document viewer
    setShowDocViewer(true);
  };

  // Close document viewer
  const handleCloseDocViewer = () => {
    setShowDocViewer(false);
  };
  
  const updateResourceStats = async (action: 'view' | 'download' | 'like' | 'comment' | 'bookmark') => {
    if (!user) {
      toast.error('Please log in to interact with resources');
      return null;
    }
    
    try {
      // Update stats in memory
      if (window.sharedResources) {
        const resourceIndex = window.sharedResources.findIndex(r => 
          (r.id === resource.id) || (r._id === resource._id));
          
        if (resourceIndex !== -1) {
          if (action === 'download') {
            window.sharedResources[resourceIndex].stats.downloads += 1;
          } else if (action === 'view') {
            window.sharedResources[resourceIndex].stats.views += 1;
          } else if (action === 'like') {
            // Don't modify the count here, we'll use the server's response
          } else if (action === 'comment') {
            window.sharedResources[resourceIndex].stats.comments += 1;
          }
          window.sharedResources[resourceIndex].stats.lastViewed = new Date().toISOString();
        }
      }
      
      // Update stats in MongoDB
      const response = await api.post('/api/resources/stats', {
        resourceId: resourceId,
        action: action,
        userId: user._id
      });
      
      console.log(`Resource ${action} recorded:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`Failed to update resource ${action} stats:`, error);
      return null;
    }
  };
  
  const handleLike = async () => {
    if (!user) {
      toast.error('Please log in to like resources');
      return;
    }
    
    try {
      setIsLoading(true);
      // We need to include the token in the headers
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/resources/${resourceId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ like: !isLiked })
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update state with the new like status and count from server
      setIsLiked(data.isLiked);
      setLikesCount(data.likesCount);
      toast.success(data.isLiked ? 'Added like' : 'Removed like');
      
      // Update the stats
      updateResourceStats('like');
      
      // Notify parent component if callback provided
      if (onLikeUpdate) {
        onLikeUpdate(resourceId, data.isLiked, data.likesCount);
      }
    } catch (error) {
      console.error('Failed to like resource:', error);
      toast.error('Failed to update like status');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast.error('Please log in to bookmark resources');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Toggle bookmark status
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/resources/${resourceId}/bookmark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Bookmark error data:', errorData);
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Bookmark response:', data);
      
      // Update local state based on server response
      setIsBookmarked(data.bookmarked);
      toast.success(data.bookmarked ? 'Resource bookmarked' : 'Removed from bookmarks');
      
      // Update the stats
      updateResourceStats('bookmark');
    } catch (error) {
      console.error('Failed to bookmark resource:', error);
      toast.error('Failed to update bookmark status');
    } finally {
      setIsLoading(false);
    }
  };
  
  // FIX: Use data attribute to guarantee unique comment section for each resource
  const handleToggleComments = async (e: React.MouseEvent, currentResourceId: string) => {
    e.stopPropagation(); // Prevent card click
    
    // Check if the clicked button matches this resource
    const clickedEl = e.currentTarget as HTMLElement;
    const clickedResourceId = clickedEl.getAttribute('data-resource-id');
    
    if (clickedResourceId !== currentResourceId) {
      return;
    }
    
    setShowComments(!showComments);
    
    if (!showComments && comments.length === 0) {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/resources/${resourceId}/comments`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        setComments(data.comments || []);
      } catch (error) {
        console.error('Failed to fetch comments:', error);
        toast.error('Failed to load comments');
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    if (!user) {
      toast.error('Please log in to comment');
      return;
    }
    
    try {
      setIsLoading(true);
      // Use fetch with explicit headers instead of axios
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
        console.error('Failed to add comment:', errorData);
        throw new Error(errorData.error || 'Failed to add comment');
      }
      
      const data = await response.json();
      const newComment = data.comment;
      
      setComments(prev => [newComment, ...prev]);
      setCommentText('');
      updateResourceStats('comment');
      toast.success('Comment added');
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div 
      className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:border-indigo-200 hover:shadow-lg transition-all h-full flex flex-col cursor-pointer"
      onClick={handleResourceOpen}
    >
      <div className="p-4 flex-1">
        <div className="flex items-start">
          <div className="bg-indigo-100 p-2 rounded-lg mr-3">
            {getIcon()}
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-800 line-clamp-2 mb-1">{resource.title}</h4>
            <p className="text-sm text-gray-600 line-clamp-2 mb-2">{resource.description}</p>
            <div className="flex items-center text-xs text-gray-500 mt-2">
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                <span>{new Date(resource.uploadDate).toLocaleDateString()}</span>
              </div>
              <span className="mx-2">•</span>
              <div className="flex items-center">
                <Eye className="h-3 w-3 mr-1" />
                <span>{resource.stats.views} views</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 p-3 flex justify-between items-center border-t border-gray-100">
        <span className="text-xs text-gray-600">
          {resource.subject || 'No subject'}
        </span>
        
        <div className="flex space-x-3">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleLike();
            }}
            className={`text-sm ${isLiked ? 'text-blue-600' : 'text-gray-600'} hover:text-blue-700 flex items-center`}
            disabled={isLoading}
          >
            <ThumbsUp className={`h-4 w-4 ${isLiked ? 'fill-blue-600' : ''}`} />
            <span className="ml-1">{likesCount}</span>
          </button>
          
          <button 
            onClick={(e) => handleToggleComments(e, resourceId)}
            className="text-gray-600 hover:text-blue-700 flex items-center"
            data-resource-id={resourceId}
          >
            <MessageSquare className="h-4 w-4" />
            <span className="ml-1">{comments.length || resource.stats.comments || 0}</span>
          </button>
          
          <button 
            onClick={handleBookmark}
            className={`${isBookmarked ? 'text-yellow-600' : 'text-gray-600'} hover:text-yellow-600`}
            title={isBookmarked ? "Remove bookmark" : "Bookmark"}
          >
            <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-yellow-500' : ''}`} />
          </button>
          
          <button 
            onClick={handleView}
            className="text-indigo-600 hover:text-indigo-700"
            title="View document"
          >
            <Eye className="h-4 w-4" />
          </button>
          
          <button 
            onClick={handleDownload}
            className="text-indigo-600 hover:text-indigo-700"
            title="Download"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {showComments && (
        <div 
          className="p-3 border-t border-gray-100 bg-gray-50"
          onClick={(e) => e.stopPropagation()} // Prevent clicks in comment section from opening resource
          data-resource-id={resourceId}
        >
          <h5 className="font-medium text-gray-700 mb-2">Comments</h5>
          
          <div className="flex items-center mb-4">
            <input 
              type="text" 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 border rounded-l-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button 
              className="bg-indigo-600 text-white py-2 px-3 rounded-r-md hover:bg-indigo-700 disabled:opacity-50"
              onClick={handleAddComment}
              disabled={isLoading || !commentText.trim()}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          
          {isLoading && comments.length === 0 ? (
            <div className="text-center py-4">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-indigo-600 border-r-transparent"></div>
              <p className="text-sm text-gray-500 mt-2">Loading comments...</p>
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {comments.map((comment, index) => (
                <div key={index} className="bg-white p-2 rounded border">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-800 font-semibold text-sm">
                        {comment.author?.fullName?.charAt(0) || 'A'}
                      </div>
                      <div className="ml-2">
                        <p className="text-sm font-medium">{comment.author?.fullName || 'Anonymous'}</p>
                        <p className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm mt-1">{comment.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-2">No comments yet. Be the first to comment!</p>
          )}
        </div>
      )}
      
      {showDocViewer && (
        <DocumentViewer 
          fileUrl={resource.fileUrl || ''} 
          fileName={resource.fileName || resource.title || 'Document'} 
          onClose={handleCloseDocViewer} 
        />
      )}
    </div>
  );
};
