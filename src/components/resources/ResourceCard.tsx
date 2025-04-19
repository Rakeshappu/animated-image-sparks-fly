
import { useState, useEffect } from 'react';
import { FileText, Video, Link as LinkIcon, File, Download, Calendar, Eye, Bookmark } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { DocumentViewer } from '../document/DocumentViewer';
import { useAuth } from '../../contexts/AuthContext';

interface ResourceCardProps {
  resource: any;
}

// Object mapping resource types to their respective icons
const resourceTypeIcons = {
  document: FileText,
  video: Video,
  link: LinkIcon,
  note: File,
  pdf: FileText
};

export const ResourceCard = ({ resource }: ResourceCardProps) => {
  const ResourceIcon = resourceTypeIcons[resource.type as keyof typeof resourceTypeIcons] || File;
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDocViewer, setShowDocViewer] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const { user } = useAuth();
  
  useEffect(() => {
    // Check if this resource is bookmarked
    const checkBookmarkStatus = async () => {
      if (!user || !resource.id) return;
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/resources/${resource.id}/bookmark-status`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsBookmarked(data.isBookmarked);
        }
      } catch (error) {
        console.error('Failed to check bookmark status:', error);
      }
    };
    
    checkBookmarkStatus();
  }, [resource.id, user]);
  
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } catch (e) {
      return 'N/A';
    }
  };
  
  // Format the date from createdAt, uploadDate, or timestamp
  const date = resource.createdAt || resource.uploadDate || resource.timestamp || new Date().toISOString();
  
  // Update view and download stats
  const updateStats = async (resourceId: string, action: 'view' | 'download' | 'bookmark') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch('/api/resources/stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ resourceId, action })
      });
      
      if (!response.ok) {
        console.error(`Failed to update ${action} stats`);
      }
    } catch (error) {
      console.error(`Error updating stats: ${error}`);
    }
  };
  
  // Handle view document button click
  const handleViewDocument = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default behavior
    e.stopPropagation(); // Prevent card click
    
    if (resource.fileUrl) {
      // Count view
      if (resource._id || resource.id) {
        updateStats(resource._id || resource.id, 'view');
      }
      
      // Show document viewer
      setShowDocViewer(true);
    } else if (resource.type === 'link' && resource.link) {
      // For links, open in new tab
      window.open(resource.link, '_blank');
      
      // Count view
      if (resource._id || resource.id) {
        updateStats(resource._id || resource.id, 'view');
      }
    } else {
      toast.error('No content available to view');
    }
  };
  
  // Handle download button click
  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default behavior
    e.stopPropagation(); // Prevent card click
    
    setIsDownloading(true);
    
    try {
      // Update download stats
      if (resource._id || resource.id) {
        await updateStats(resource._id || resource.id, 'view');
        await updateStats(resource._id || resource.id, 'download');
      }
      
      if (resource.fileUrl) {
        // Direct download without opening viewer
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
    } finally {
      setIsDownloading(false);
    }
  };
  
  // Handle bookmark toggle
  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default behavior
    e.stopPropagation(); // Prevent card click
    
    if (!user) {
      toast.error('Please log in to bookmark resources');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/resources/${resource.id || resource._id}/bookmark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to update bookmark status');
      }
      
      const data = await response.json();
      
      // Toggle bookmark state
      setIsBookmarked(data.bookmarked);
      
      // Update stats
      if (resource._id || resource.id) {
        await updateStats(resource._id || resource.id, 'bookmark');
      }
      
      toast.success(isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks');
    } catch (error) {
      console.error('Bookmark error:', error);
      toast.error('Failed to update bookmark status');
    }
  };

  // Handle card click to view document
  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default behavior
    
    // Same as handleViewDocument but without stopPropagation
    if (resource.fileUrl) {
      // Count view
      if (resource._id || resource.id) {
        updateStats(resource._id || resource.id, 'view');
      }
      
      // Show document viewer
      setShowDocViewer(true);
    } else if (resource.type === 'link' && resource.link) {
      // For links, open in new tab
      window.open(resource.link, '_blank');
      
      // Count view
      if (resource._id || resource.id) {
        updateStats(resource._id || resource.id, 'view');
      }
    } else {
      toast.error('No content available to view');
    }
  };
  
  // Handle close document viewer
  const handleCloseDocViewer = () => {
    setShowDocViewer(false);
  };
  
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:border-indigo-200 hover:shadow-lg transition-all h-full flex flex-col cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="p-4 flex-1">
        <div className="flex items-start">
          <div className="bg-indigo-100 p-2 rounded-lg mr-3">
            <ResourceIcon className="h-6 w-6 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-800 mb-1 line-clamp-2">
              {resource.title}
            </h3>
            <p className="text-sm text-gray-500 line-clamp-2 mb-2">
              {resource.description}
            </p>
            <div className="flex items-center mt-3 text-xs text-gray-500">
              <span className="capitalize mr-3">{resource.type}</span>
              <span className="mr-3">•</span>
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                <span>{formatDate(date)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 px-4 py-3 flex justify-between items-center border-t border-gray-100">
        <span className="text-xs text-gray-600">
          {resource.subject || 'Subject not specified'}
        </span>
        
        <div className="flex space-x-3">
          <button 
            onClick={handleViewDocument}
            className="text-indigo-600 hover:text-indigo-800 transition-colors"
            title="View document"
          >
            <Eye className="h-4 w-4" />
          </button>
          
          <button 
            onClick={handleDownload}
            className="text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
            title="Download"
            disabled={isDownloading}
          >
            {isDownloading ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></span>
            ) : (
              <Download className="h-4 w-4" />
            )}
          </button>
          
          <button
            onClick={handleBookmark}
            className={`${isBookmarked ? 'text-yellow-600' : 'text-gray-600'} hover:text-yellow-600`}
            title={isBookmarked ? "Remove bookmark" : "Bookmark"}
          >
            <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-yellow-500' : ''}`} />
          </button>
        </div>
      </div>
      
      {showDocViewer && (
        <DocumentViewer 
          fileUrl={resource.fileUrl} 
          fileName={resource.fileName || resource.title} 
          onClose={handleCloseDocViewer} 
        />
      )}
    </motion.div>
  );
};
