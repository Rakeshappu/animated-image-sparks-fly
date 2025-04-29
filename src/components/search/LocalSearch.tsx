
import { useState, useEffect, useRef } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useOutsideClick } from '../../hooks/useOutsideClick';
import { FacultyResource } from '../../types/faculty';

interface LocalSearchProps {
  resources: any[];
  onSearchResults: (results: any[]) => void;
  placeholder?: string;
}

export const LocalSearch = ({ resources, onSearchResults, placeholder = "Search resources..." }: LocalSearchProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: [] as string[],
    category: [] as string[]
  });
  const { user } = useAuth();
  const filterRef = useRef<HTMLDivElement>(null);
  
  // Use custom hook to detect clicks outside the filter area
  useOutsideClick(filterRef, () => {
    if (showFilters) setShowFilters(false);
  });

  useEffect(() => {
    const performSearch = () => {
      const term = searchTerm.toLowerCase().trim();
      
      let filtered = resources;
      
      // For students, only show resources from their semester
      if (user?.role === 'student' && user.semester) {
        filtered = filtered.filter(resource => resource.semester === user.semester);
      }
      
      // Apply search term filter - search in title, description, subject, and also fileContent if available
      if (term) {
        filtered = filtered.filter(resource => {
          return (
            resource.title?.toLowerCase().includes(term) ||
            resource.description?.toLowerCase().includes(term) ||
            resource.subject?.toLowerCase().includes(term) ||
            resource.fileContent?.toLowerCase().includes(term)
          );
        });
      }

      // Apply type filters
      if (filters.type.length > 0) {
        filtered = filtered.filter(resource => filters.type.includes(resource.type));
      }
      
      // Apply category filters
      if (filters.category.length > 0) {
        filtered = filtered.filter(resource => filters.category.includes(resource.category));
      }

      onSearchResults(filtered);
    };

    performSearch();
  }, [searchTerm, resources, user, filters, onSearchResults]);

  const clearSearch = () => {
    setSearchTerm('');
    setFilters({
      type: [],
      category: []
    });
    onSearchResults(resources);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-20 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex space-x-1">
          {searchTerm && (
            <button
              type="button"
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              onClick={clearSearch}
            >
              <X className="h-5 w-5" />
            </button>
          )}
          <button 
            type="button"
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {showFilters && (
        <div 
          ref={filterRef}
          className="mt-2 p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 z-20 absolute w-full"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Resource Type</h3>
              <div className="space-y-2">
                {['document', 'video', 'link', 'note'].map((type) => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-indigo-600"
                      checked={filters.type.includes(type)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters({
                            ...filters,
                            type: [...filters.type, type],
                          });
                        } else {
                          setFilters({
                            ...filters,
                            type: filters.type.filter((t) => t !== type),
                          });
                        }
                      }}
                    />
                    <span className="ml-2 text-gray-700 dark:text-gray-300 capitalize">{type}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Categories</h3>
              <div className="space-y-2">
                {['Lecture Notes', 'Assignments', 'Lab Manuals', 'Previous Year Papers', 'Reference Materials'].map((category) => (
                  <label key={category} className="flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-indigo-600"
                      checked={filters.category.includes(category)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters({
                            ...filters,
                            category: [...filters.category, category],
                          });
                        } else {
                          setFilters({
                            ...filters,
                            category: filters.category.filter((c) => c !== category),
                          });
                        }
                      }}
                    />
                    <span className="ml-2 text-gray-700 dark:text-gray-300">{category}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-between">
            <button
              type="button"
              className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
              onClick={() => {
                setFilters({
                  type: [],
                  category: []
                });
              }}
            >
              Clear Filters
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
              onClick={() => setShowFilters(false)}
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
