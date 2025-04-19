
import { ResourceCard } from './ResourceCard';
import { useState, useEffect } from 'react';
import { FacultyResource } from '../../types/faculty';
import { getStandardizedCategory, getCategoryNameById } from '../../utils/placementCategoryUtils';
import { motion } from 'framer-motion';

interface SemesterResourcesProps {
  semester: number;
  resources: FacultyResource[];
  loading?: boolean;
  showAllSemesters?: boolean;
  placementCategory?: string;
}

export const SemesterResources = ({ 
  semester, 
  resources, 
  loading = false,
  showAllSemesters = false,
  placementCategory
}: SemesterResourcesProps) => {
  const [filter, setFilter] = useState<string>('all');
  const [filteredResources, setFilteredResources] = useState<FacultyResource[]>([]);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'alphabetical'>('newest');
  
  useEffect(() => {
    // Filter resources whenever props change
    let result = resources && Array.isArray(resources) ? [...resources] : [];
    
    // First, filter by semester or placement category
    result = result.filter(resource => {
      // For placement resources (semester 0 or category='placement')
      if (resource.category === 'placement' || semester === 0) {
        // If we're specifically looking at a placement category
        if (placementCategory) {
          const standardizedRequestedCategory = getStandardizedCategory(placementCategory);
          const resourceCategory = getStandardizedCategory(resource.placementCategory || '');
          
          // Direct matching between standardized categories
          return resourceCategory === standardizedRequestedCategory;
        }
        
        // If viewing all placement resources (semester 0)
        if (semester === 0) {
          return true;
        }
        
        // Students in all semesters should see placement resources
        return showAllSemesters;
      }
      
      // For regular resources, match the semester
      if (showAllSemesters) {
        return true;
      }
      
      return resource.semester === semester || 
        resource.semester === Number(semester);
    });
    
    // Then, apply type filter if selected
    if (filter !== 'all') {
      result = result.filter(resource => resource.type === filter);
    }
    
    // Apply sorting
    switch (sortOrder) {
      case 'newest':
        result.sort((a, b) => 
          new Date(b.uploadDate || b.createdAt || '').getTime() - 
          new Date(a.uploadDate || a.createdAt || '').getTime()
        );
        break;
      case 'oldest':
        result.sort((a, b) => 
          new Date(a.uploadDate || a.createdAt || '').getTime() - 
          new Date(b.uploadDate || b.createdAt || '').getTime()
        );
        break;
      case 'alphabetical':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }
    
    setFilteredResources(result);
  }, [resources, semester, placementCategory, filter, showAllSemesters, sortOrder]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Semester {semester} Resources</h2>
          <div className="animate-pulse h-8 w-32 bg-gray-200 rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-40 bg-gray-200 rounded-md"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const getTitle = () => {
    if (showAllSemesters) return "All Semester Resources";
    if (semester === 0) {
      return placementCategory 
        ? `${getCategoryNameById(placementCategory)} Resources` 
        : "Placement Resources";
    }
    return `Semester ${semester} Resources`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{getTitle()}</h2>
        
        <div className="flex items-center space-x-3 flex-wrap gap-2">
          <select
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            aria-label="Sort resources"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="alphabetical">Alphabetical</option>
          </select>
          
          <select
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="Filter by type"
          >
            <option value="all">All Types</option>
            <option value="document">Documents</option>
            <option value="video">Videos</option>
            <option value="link">Links</option>
            <option value="note">Notes</option>
          </select>
        </div>
      </div>
      
      {filteredResources.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg">
            {showAllSemesters 
              ? "No resources available currently."
              : semester === 0 
                ? placementCategory
                  ? `No ${getCategoryNameById(placementCategory)} resources available currently.`
                  : "No placement resources available currently."
                : "No resources available for this semester."}
          </p>
          <p className="text-sm mt-2">Check back later or ask your faculty to upload resources.</p>
        </div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {filteredResources.map((resource) => (
            <motion.div key={resource._id || resource.id} variants={item}>
              <ResourceCard resource={resource} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};
