
import { useState, useEffect, useRef } from 'react';
import { Search, Filter, Loader, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { generateText } from '../../services/openai.service';
import { useOutsideClick } from '../../hooks/useOutsideClick';

// Define the SearchFilters type
interface SearchFilters {
  query: string;
  type: string[];
  category: string[];
}

// Define a simplified Resource type for search results
interface SearchResource {
  _id: string;
  title: string;
  description?: string;
  type: string;
  subject?: string;
  semester?: number;
}

export const SearchBar = () => {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    type: [],
    category: []
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResource[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [showAiSummary, setShowAiSummary] = useState(true);
  const [relatedQuestions, setRelatedQuestions] = useState<string[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  
  // Use custom hook to detect clicks outside the filter area
  useOutsideClick(filterRef, () => {
    if (showFilters) setShowFilters(false);
  });

  // Function to handle search submission
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filters.query.trim()) return;
    
    setIsSearching(true);
    setAiSummary(null);
    setShowAiSummary(true);
    setRelatedQuestions([]);
    setApiError(null);
    
    try {
      // Build search parameters
      const params = new URLSearchParams();
      params.append('q', filters.query);
      
      // Add type filters if any are selected
      if (filters.type.length > 0) {
        filters.type.forEach(type => {
          params.append('type', type);
        });
      }
      
      // Add category filters if any are selected
      if (filters.category.length > 0) {
        filters.category.forEach(category => {
          params.append('category', category);
        });
      }
      
      // First try to search local resources in database
      const response = await api.get(`/api/search?${params.toString()}`);
      const results = response.data.results || [];
      setSearchResults(results);
      
      if (results.length === 0) {
        toast("No local resources found matching your query", { 
          icon: '📚',
        });
      } else {
        // Close filters after search
        setShowFilters(false);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setApiError(error instanceof Error ? error.message : 'Search failed. Please try again.');
      toast.error('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleResourceClick = (resourceId: string) => {
    navigate(`/resources/${resourceId}`);
  };

  const handleRelatedQuestionClick = (question: string) => {
    setFilters({ ...filters, query: question });
    setTimeout(() => {
      handleSearch(new Event('submit') as any);
    }, 100);
  };

  const closeAiSummary = () => {
    setShowAiSummary(false);
  };

  // Focus the search input on component mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          ref={searchInputRef}
          placeholder="Search course materials in your semester..."
          className="w-full px-4 py-3 pl-12 pr-10 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors"
          value={filters.query}
          onChange={(e) => setFilters({ ...filters, query: e.target.value })}
        />
        <div className="absolute left-4 top-3.5">
          {isSearching ? (
            <Loader className="h-5 w-5 text-indigo-500 animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-gray-400" />
          )}
        </div>
        <button 
          type="button"
          className="absolute right-3 top-3 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-5 w-5" />
        </button>
        <button 
          type="submit"
          className="absolute right-12 top-2 p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
        >
          <Search className="h-5 w-5" />
        </button>
      </form>
      
      {showFilters && (
        <div 
          ref={filterRef}
          className="mt-2 p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 z-20 relative"
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
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
              onClick={handleSearch}
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
      
      {isSearching && (
        <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded shadow">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {apiError && !isSearching && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <p className="font-medium">Search Error</p>
          <p className="text-sm">{apiError}</p>
        </div>
      )}
      
      {!isSearching && searchResults && searchResults.length > 0 && (
        <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded shadow z-10 relative">
          <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Search Results</h3>
          <div className="space-y-3">
            {searchResults.map((resource) => (
              <div 
                key={resource._id}
                className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors shadow-sm"
                onClick={() => handleResourceClick(resource._id)}
              >
                <h4 className="text-indigo-600 dark:text-indigo-400 font-medium">{resource.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{resource.description}</p>
                <div className="flex mt-2 text-xs text-gray-500">
                  <span className="mr-3 capitalize">{resource.type}</span>
                  <span className="mr-3">{resource.subject}</span>
                  <span>{resource.semester !== undefined ? `${resource.semester}th Semester` : ''}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {!isSearching && searchResults && searchResults.length === 0 && filters.query && !apiError && (
        <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded shadow text-center">
          <p className="text-gray-500">No local resources found matching your search criteria.</p>
        </div>
      )}
    </div>
  );
};
