
import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { useOutsideClick } from '../../hooks/useOutsideClick';

interface LocalSearchProps {
  resources: any[];
  onSearchResults: (results: any[], hasSearched: boolean) => void;
  placeholder?: string;
}

export const LocalSearch = ({ resources, onSearchResults, placeholder = "Search resources..." }: LocalSearchProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: [] as string[],
    category: [] as string[]
  });
  const [hasUserSearched, setHasUserSearched] = useState(false);
  const [isResultsVisible, setIsResultsVisible] = useState(false);
  
  const filterRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  
  // Use custom hook to detect clicks outside the filter and search results areas
  useOutsideClick(filterRef, () => {
    if (showFilters) setShowFilters(false);
  });
  
  // Close search results when clicking outside
  useOutsideClick(resultsRef, () => {
    if (isResultsVisible) {
      setIsResultsVisible(false);
      setHasUserSearched(false);
    }
  }, [searchInputRef]);

  // Memoize the search function to prevent unnecessary re-renders
  const performSearch = useCallback(() => {
    console.log('Performing search with term:', searchTerm);
    console.log('Total resources available:', resources.length);
    
    // Only search if there's a search term or filters applied
    const isSearchActive = searchTerm.trim() !== '' || filters.type.length > 0 || filters.category.length > 0;
    
    if (!isSearchActive) {
      onSearchResults([], false);
      setIsResultsVisible(false);
      return;
    }
    
    const term = searchTerm.toLowerCase().trim();
    
    let filtered = [...resources];
    console.log('Filtering from total resources:', filtered.length);
    
    // Apply search term filter - search in title, description, subject, and also fileContent if available
    if (term) {
      filtered = filtered.filter(resource => {
        const matchesTitle = resource.title?.toLowerCase().includes(term) || false;
        const matchesDescription = resource.description?.toLowerCase().includes(term) || false;
        const matchesSubject = resource.subject?.toLowerCase().includes(term) || false;
        const matchesCategory = resource.category?.toLowerCase().includes(term) || false;
        const matchesPlacementCategory = resource.placementCategory?.toLowerCase().includes(term) || false;
        const matchesFileContent = resource.fileContent?.toLowerCase().includes(term) || false;
        
        return matchesTitle || matchesDescription || matchesSubject || matchesCategory || 
               matchesPlacementCategory || matchesFileContent;
      });
      
      console.log('After term filtering:', filtered.length);
    }

    // Apply type filters
    if (filters.type.length > 0) {
      filtered = filtered.filter(resource => filters.type.includes(resource.type));
      console.log('After type filtering:', filtered.length);
    }
    
    // Apply category filters
    if (filters.category.length > 0) {
      filtered = filtered.filter(resource => {
        return filters.category.includes(resource.category || '') || 
               filters.category.includes(resource.placementCategory || '');
      });
      console.log('After category filtering:', filtered.length);
    }
    
    // Debug selected resources
    if (filtered.length > 0) {
      console.log('Sample of filtered resources:', filtered.slice(0, 2));
    }
    
    onSearchResults(filtered, isSearchActive);
    setIsResultsVisible(true);
  }, [searchTerm, filters, resources, onSearchResults]);

  // Run search when search term or filters change
  useEffect(() => {
    if (hasUserSearched) {
      performSearch();
    }
  }, [searchTerm, filters, hasUserSearched, performSearch]);

  // Run search on component mount if we have resources
  useEffect(() => {
    if (resources.length > 0) {
      console.log('Resources loaded:', resources.length);
    }
  }, [resources]);

  // Handle search input change
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setHasUserSearched(true);
  };

  // Handle filter change
  const handleFilterChange = (type: 'type' | 'category', value: string, checked: boolean) => {
    setHasUserSearched(true);
    if (checked) {
      setFilters({
        ...filters,
        [type]: [...filters[type], value],
      });
    } else {
      setFilters({
        ...filters,
        [type]: filters[type].filter((item) => item !== value),
      });
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    setFilters({
      type: [],
      category: []
    });
    setHasUserSearched(false);
    setIsResultsVisible(false);
    onSearchResults([], false); // Clear the search results immediately
  };

  // Close search results explicitly
  const closeSearchResults = () => {
    setIsResultsVisible(false);
    setHasUserSearched(false);
    onSearchResults([], false);
  };

  return (
    <div className="relative w-full" ref={searchInputRef}>
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchInputChange}
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
              aria-label="Clear search"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          <button 
            type="button"
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            onClick={() => setShowFilters(!showFilters)}
            aria-label="Show filters"
          >
            <Filter className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {showFilters && (
        <div 
          ref={filterRef}
          className="mt-2 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 absolute w-full"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Resource Type</h3>
              <div className="space-y-2">
                {['document', 'video', 'link', 'note'].map((type) => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-indigo-600 rounded"
                      checked={filters.type.includes(type)}
                      onChange={(e) => handleFilterChange('type', type, e.target.checked)}
                    />
                    <span className="ml-2 text-gray-700 dark:text-gray-300 capitalize">{type}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Categories</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                {['placement', 'Lecture Notes', 'Assignments', 'Lab Manuals', 'Previous Year Papers', 'Reference Materials', 'study', 'common', 'aptitude', 'interview', 'resume', 'coding', 'companies', 'general'].map((category) => (
                  <label key={category} className="flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-indigo-600 rounded"
                      checked={filters.category.includes(category)}
                      onChange={(e) => handleFilterChange('category', category, e.target.checked)}
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
                setHasUserSearched(true);
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
      
      {/* Pass resultsRef to parent component so they can add proper ref to results div */}
      {isResultsVisible && hasUserSearched && (
        <div className="absolute w-full shadow-lg z-10 text-right p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md mt-1" ref={resultsRef}>
          <button
            onClick={closeSearchResults}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Close search results"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
};
