
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Book, ArrowLeft, Filter } from 'lucide-react';
import { ResourceItem } from '../../components/study/ResourceItem';
import { FacultyResource } from '../../types/faculty';
import { LocalSearch } from '../../components/search/LocalSearch';
import { useAuth } from '../../contexts/AuthContext';
import { trackResourceView } from '../../utils/studyUtils';

const categories = [
  { id: 'aptitude', name: 'Aptitude Tests' },
  { id: 'interview', name: 'Interview Preparation' },
  { id: 'resume', name: 'Resume Building' },
  { id: 'coding', name: 'Coding Practice' },
  { id: 'companies', name: 'Company Specific' },
  { id: 'general', name: 'General Resources' }
];

export const PlacementResourcesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [resources, setResources] = useState<FacultyResource[]>([]);
  const [filteredResources, setFilteredResources] = useState<FacultyResource[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(searchParams.get('category') || 'general');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'alphabetical'>('recent');
  const [isLoading, setIsLoading] = useState(true);
  
  // Load resources from shared resources
  useEffect(() => {
    const loadResources = () => {
      setIsLoading(true);
      
      if (typeof window !== 'undefined' && window.sharedResources) {
        // Filter only placement resources
        const placementResources = window.sharedResources.filter(
          (resource: FacultyResource) => resource.category === 'placement'
        );
        
        setResources(placementResources);
        setFilteredResources(placementResources);
      }
      
      setIsLoading(false);
    };
    
    loadResources();
    
    // Set up polling to check for updates
    const intervalId = setInterval(() => {
      if (typeof window !== 'undefined' && window.sharedResources) {
        const placementResources = window.sharedResources.filter(
          (resource: FacultyResource) => resource.category === 'placement'
        );
        setResources(placementResources);
      }
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Filter resources by category
  useEffect(() => {
    if (!selectedCategory) {
      setFilteredResources(resources);
      return;
    }
    
    const filtered = resources.filter(resource => 
      resource.placementCategory === selectedCategory
    );
    
    setFilteredResources(filtered);
    
    // Update URL search params when category changes
    setSearchParams({ category: selectedCategory });
  }, [selectedCategory, resources, setSearchParams]);
  
  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };
  
  // Handle search results
  const handleSearchResults = (results: FacultyResource[]) => {
    setFilteredResources(results);
  };
  
  // Sort resources based on selected sort option
  const sortedResources = (() => {
    if (sortBy === 'recent') {
      return [...filteredResources].sort((a, b) => 
        new Date(b.createdAt || b.uploadDate || '').getTime() - 
        new Date(a.createdAt || a.uploadDate || '').getTime()
      );
    } else if (sortBy === 'popular') {
      return [...filteredResources].sort((a, b) => 
        (b.stats?.views || 0) - (a.stats?.views || 0)
      );
    } else {
      return [...filteredResources].sort((a, b) => 
        a.title.localeCompare(b.title)
      );
    }
  })();
  
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
  
  return (
    <motion.div 
      className="p-6 min-h-screen"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants}>
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </button>
        
        <h1 className="text-2xl font-bold mb-2">Placement Preparation Resources</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Explore resources to help you prepare for placement opportunities.
        </p>
      </motion.div>
      
      <motion.div variants={itemVariants} className="mb-6">
        <LocalSearch 
          resources={resources} 
          onSearchResults={handleSearchResults} 
          placeholder="Search placement resources..."
        />
      </motion.div>
      
      <div className="flex flex-wrap mb-6">
        {categories.map(category => (
          <motion.button
            key={category.id}
            variants={itemVariants}
            className={`px-4 py-2 rounded-full mr-2 mb-2 ${
              selectedCategory === category.id
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            } transition-colors`}
            onClick={() => handleCategorySelect(category.id)}
          >
            {category.name}
          </motion.button>
        ))}
      </div>
      
      <motion.div variants={itemVariants} className="mb-6 flex justify-end">
        <div className="relative inline-block">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'recent' | 'popular' | 'alphabetical')}
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
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : sortedResources.length === 0 ? (
        <motion.div 
          variants={itemVariants}
          className="flex flex-col items-center justify-center p-12 bg-white rounded-lg shadow-sm"
        >
          <Book className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-700">No resources found</h3>
          <p className="text-gray-500 text-center mt-1">
            {selectedCategory 
              ? `No resources available for ${categories.find(c => c.id === selectedCategory)?.name}` 
              : 'No placement resources available'}
          </p>
        </motion.div>
      ) : (
        <motion.div 
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {sortedResources.map((resource) => (
            <motion.div key={resource._id || resource.id} variants={itemVariants}>
              <ResourceItem 
                resource={resource} 
                source="placement"
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

export default PlacementResourcesPage;
