
import React, { useState, useEffect } from 'react';
import { FileText, Download, Eye, Bookmark, Calendar, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { DocumentViewer } from '../../components/document/DocumentViewer.ts';
import { useAuth } from '../../contexts/AuthContext.ts';

interface StarredResource {
  _id: string;
  title: string;
  description: string;
  type: 'document' | 'video' | 'link';
  fileUrl?: string;
  link?: string;
  fileName?: string;
  subject: string;
  uploadDate?: string;
  createdAt: string;
  stats: {
    views: number;
    downloads: number;
    likes: number;
    comments: number;
    lastViewed?: string;
  };
  uploadedBy?: {
    name: string;
    id: string;
  };
}

export const StarredPage = () => {
  const [starredItems, setStarredItems] = useState<StarredResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDocViewer, setShowDocViewer] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<{url: string, name: string}>({url: '', name: ''});
  const { user } = useAuth();

  useEffect(() => {
    fetchBookmarkedResources();
  }, []);

  const fetchBookmarkedResources = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/resources/bookmarks', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bookmarked resources');
      }

      const data = await response.json();
      setStarredItems(data.resources || []);
    } catch (error) {
      console.error('Error fetching bookmarked resources:', error);
      toast.error('Failed to load bookmarked resources');
      // Try to load from localStorage if API fails
      const cachedResources = localStorage.getItem('bookmarkedResources');
      if (cachedResources) {
        setStarredItems(JSON.parse(cachedResources));
      }
    } finally {
      setLoading(false);
    }
  };

  const removeFromStarred = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/resources/${id}/bookmark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to remove bookmark');
      }

      // Update local state
      setStarredItems(starredItems.filter(item => item._id !== id));
      toast.success('Removed from bookmarks');
      
      // Update localStorage cache
      localStorage.setItem('bookmarkedResources', JSON.stringify(
        starredItems.filter(item => item._id !== id)
      ));
    } catch (error) {
      console.error('Error removing bookmark:', error);
      toast.error('Failed to remove bookmark');
    }
  };

  const incrementViewCount = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch(`/api/resources/${id}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Update the view count in the local state
        setStarredItems(prevItems => 
          prevItems.map(item => 
            item._id === id 
              ? { ...item, stats: { ...item.stats, views: data.views || (item.stats?.views || 0) + 1 }} 
              : item
          )
        );
      }
    } catch (error) {
      console.error('Error updating view count:', error);
    }
  };

  const handleDownload = (item: StarredResource) => {
    if (item.fileUrl) {
      // Direct download
      const a = document.createElement('a');
      a.href = item.fileUrl;
      a.download = item.fileName || item.title || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (item.type === 'link' && item.link) {
      // Open link in new tab
      window.open(item.link, '_blank');
    } else {
      toast.error('No file or link available for download');
    }
  };

  const handleView = (item: StarredResource) => {
    incrementViewCount(item._id);
    
    if (item.fileUrl) {
      setCurrentDocument({
        url: item.fileUrl,
        name: item.fileName || item.title || 'Document'
      });
      setShowDocViewer(true);
    } else if (item.type === 'link' && item.link) {
      window.open(item.link, '_blank');
    } else {
      toast.error('No content available to view');
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
          <Bookmark className="mr-2 text-yellow-500" size={24} />
          Bookmarked Resources
        </h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-yellow-500"></div>
        </div>
      ) : starredItems.length === 0 ? (
        <div className="text-center py-10">
          <Bookmark className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No bookmarked items</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            You haven't bookmarked any items yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {starredItems.map((item) => (
            <div key={item._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all">
              <div className="p-4">
                <div className="flex items-center mb-3">
                  <div className={`p-2 rounded-lg ${
                    item.type === 'video' ? 'bg-red-100 text-red-600' :
                    item.type === 'link' ? 'bg-blue-100 text-blue-600' :
                    'bg-green-100 text-green-600'
                  }`}>
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="ml-3">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 line-clamp-1">{item.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.type} • {item.subject}</p>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">{item.description}</p>
                
                <div className="flex items-center text-xs text-gray-500 mb-2">
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  <span>{item.stats?.views || 0} views</span>
                </div>
                
                <div className="flex items-center text-xs text-gray-500 mb-2">
                  <Calendar className="h-3.5 w-3.5 mr-1" />
                  <span>{formatDate(item.createdAt)}</span>
                </div>
                
                {item.uploadedBy && (
                  <div className="flex items-center text-xs text-gray-500">
                    <User className="h-3.5 w-3.5 mr-1" />
                    <span>Uploaded by {item.uploadedBy.name}</span>
                  </div>
                )}
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 flex justify-end items-center">
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleView(item)}
                    className="p-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                    title="View"
                  >
                    <Eye size={18} />
                  </button>
                  <button 
                    onClick={() => handleDownload(item)}
                    className="p-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                    title="Download"
                  >
                    <Download size={18} />
                  </button>
                  <button 
                    onClick={() => removeFromStarred(item._id)}
                    className="p-1 text-yellow-500 hover:text-yellow-600"
                    title="Remove from bookmarks"
                  >
                    <Bookmark size={18} fill="currentColor" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {showDocViewer && (
        <DocumentViewer 
          fileUrl={currentDocument.url} 
          fileName={currentDocument.name} 
          onClose={() => setShowDocViewer(false)} 
        />
      )}
    </div>
  );
};

export default StarredPage;
