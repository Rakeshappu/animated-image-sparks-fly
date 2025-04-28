
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Search, Filter } from 'lucide-react';
import { ResourceCard } from '../../components/resources/ResourceCard';
import { getPlacementResources } from '../../services/resource.service';
import { motion } from 'framer-motion';

const placementCategories = [
  { id: 'all', name: 'All Resources' },
  { id: 'aptitude', name: 'Aptitude & Reasoning' },
  { id: 'interviews', name: 'Interview Prep' },
  { id: 'resume', name: 'Resume Building' },
  { id: 'technical', name: 'Technical Skills' },
  { id: 'companies', name: 'Company Specific' },
  { id: 'general', name: 'General Resources' }
];

export const PlacementResourcesPage = () => {
  const navigate = useNavigate();
  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'alphabetical'>('recent');

  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true);
      try {
        const data = await getPlacementResources();
        setResources(data);
        setFilteredResources(data);
      } catch (error) {
        console.error('Error fetching placement resources:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  useEffect(() => {
    // Filter resources based on category and search term
    let result = [...resources];
    
    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter(resource => 
        resource.placementCategory === selectedCategory
      );
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(resource => 
        resource.title.toLowerCase().includes(term) || 
        resource.description?.toLowerCase().includes(term) || 
        resource.subject?.toLowerCase().includes(term)
      );
    }
    
    // Sort resources
    if (sortBy === 'recent') {
      result.sort((a, b) => new Date(b.createdAt || b.timestamp).getTime() - 
                            new Date(a.createdAt || a.timestamp).getTime());
    } else if (sortBy === 'popular') {
      result.sort((a, b) => (b.stats?.views || 0) - (a.stats?.views || 0));
    } else if (sortBy === 'alphabetical') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }
    
    setFilteredResources(result);
  }, [resources, selectedCategory, searchTerm, sortBy]);

  // View count update handler
  const handleViewCountUpdated = (resourceId: string, newCount: number) => {
    setResources(prev => 
      prev.map(resource => 
        resource.id === resourceId || resource._id === resourceId
          ? { 
            ...resource, 
            stats: { 
              ...resource.stats, 
              views: newCount 
            } 
          }
          : resource
      )
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold mb-2 flex items-center">
          <Briefcase className="mr-2" />
          Placement Resources
        </h1>
        <p className="text-gray-600 mb-8">
          Access materials to help you prepare for campus placements and job interviews.
        </p>
      </motion.div>

      <div className="bg-white rounded-lg shadow-md p-4 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
          <div className="relative w-full md:w-1/2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search placement resources..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-4 w-full md:w-auto">
            <div className="relative w-full md:w-auto">
              <select
                className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="recent">Most Recent</option>
                <option value="popular">Most Popular</option>
                <option value="alphabetical">Alphabetical</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <Filter className="h-4 w-4 text-gray-500" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {placementCategories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedCategory === category.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : filteredResources.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredResources.map((resource) => (
            <ResourceCard 
              key={resource.id || resource._id} 
              resource={resource}
              onViewCountUpdated={handleViewCountUpdated}
            />
          ))}
        </motion.div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-xl font-medium text-gray-900">No resources found</h3>
          <p className="mt-1 text-gray-500">
            {searchTerm 
              ? `No results matching "${searchTerm}"` 
              : 'No placement resources available for this category'}
          </p>
        </div>
      )}
    </div>
  );
};

export default PlacementResourcesPage;
