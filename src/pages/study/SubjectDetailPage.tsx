//src\pages\study\SubjectDetailPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Filter } from 'lucide-react';
import { ResourceItem } from '../../components/study/ResourceItem';
import { FacultyResource } from '../../types/faculty';
import { motion } from 'framer-motion';

export const SubjectDetailPage = () => {
  const { subject } = useParams<{ subject: string }>();
  const navigate = useNavigate();
  const [resources, setResources] = useState<FacultyResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'alphabetical'>('recent');
  
  useEffect(() => {
    // Fetch resources for this subject
    const fetchSubjectResources = () => {
      setLoading(true);
      
      // Use window.sharedResources as our data source (in a real app, this would be an API call)
      if (typeof window !== 'undefined' && window.sharedResources) {
        const filteredResources = window.sharedResources.filter(
          (resource: FacultyResource) => resource.subject === subject
        );
        
        setResources(filteredResources);
      }
      
      setLoading(false);
    };
    
    fetchSubjectResources();
  }, [subject]);
  
  // Sort resources based on selected sort option
  const sortedResources = (() => {
    if (sortBy === 'recent') {
      return [...resources].sort((a, b) => 
        new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
      );
    } else if (sortBy === 'popular') {
      return [...resources].sort((a, b) => b.stats.views - a.stats.views);
    } else {
      return [...resources].sort((a, b) => a.title.localeCompare(b.title));
    }
  })();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <button 
          onClick={() => navigate('/study-materials')} 
          className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to All Subjects
        </button>
        
        <h1 className="text-2xl font-bold mt-4 dark:text-gray-200">{subject}</h1>
        <p className="text-gray-500">
          {resources.length} resource{resources.length !== 1 ? 's' : ''} available
        </p>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="mb-6 flex justify-end"
      >
        <div className="relative inline-block">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="recent">Most Recent</option>
            <option value="popular">Most Popular</option>
            <option value="alphabetical">Alphabetical</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
            <Filter className="h-4 w-4 text-gray-500" />
          </div>
        </div>
      </motion.div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : sortedResources.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          {sortedResources.map((resource) => (
            <ResourceItem key={resource.id || resource._id} resource={resource} />
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="bg-white rounded-lg shadow-md p-8 text-center"
        >
          <p className="text-gray-500">No resources found for this subject</p>
        </motion.div>
      )}
    </div>
  );
};

export default SubjectDetailPage;
