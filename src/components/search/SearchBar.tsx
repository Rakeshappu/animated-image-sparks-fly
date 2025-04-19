
import { useState, useEffect, useRef } from 'react';
import { Search, Filter, Loader, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { generateText } from '../../services/openai.service';

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
      // First try to search local resources in database
      const response = await api.get(`/api/search?q=${encodeURIComponent(filters.query)}`);
      const results = response.data.results || [];
      setSearchResults(results);
      
      // Then get AI-enhanced information using Serper AI
      try {
        const aiResponse = await generateText(
          `Find the best educational resources, research papers, and learning materials about: ${filters.query}. Include details about each resource including title, source, and a brief description of what can be learned.`
        );
        
        if (aiResponse.success) {
          setAiSummary(aiResponse.text);
          if (aiResponse.relatedQuestions && aiResponse.relatedQuestions.length > 0) {
            setRelatedQuestions(aiResponse.relatedQuestions);
          }
        }
      } catch (aiError) {
        console.error('AI summary generation failed:', aiError);
        // We don't show this error to the user as the main search still worked
      }
      
      // Dispatch event for global search
      const customEvent = new CustomEvent('globalSearch', { 
        detail: { 
          query: filters.query,
          results: results,
          aiSummary: aiSummary,
          relatedQuestions: relatedQuestions
        }
      });
      document.dispatchEvent(customEvent);
      
      // If no results, show a message
      if (results.length === 0) {
        toast.info('No local resources found. Showing AI-powered results from the web.');
      }
      
    } catch (error: any) {
      console.error('Search failed:', error);
      setApiError(error.message || 'Search failed. Please try again.');
      toast.error('Search failed. Please try again.');
      // Still try to get AI results even if local search fails
      try {
        const aiResponse = await generateText(
          `Find the best educational resources, research papers, and learning materials about: ${filters.query}. Include details about each resource including title, source, and a brief description of what can be learned.`
        );
        
        if (aiResponse.success) {
          setAiSummary(aiResponse.text);
          if (aiResponse.relatedQuestions && aiResponse.relatedQuestions.length > 0) {
            setRelatedQuestions(aiResponse.relatedQuestions);
          }
        }
      } catch (aiError) {
        console.error('AI summary generation failed:', aiError);
      }
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

  // Function to format and highlight the AI summary
  const formatAiSummary = (text: string) => {
    if (!text) return [];
    
    // Split by lines
    return text.split('\n').map((line, index) => {
      // Check if line is a heading (starts with a number followed by a dot)
      if (/^\d+\.\s+\*\*.*\*\*/.test(line)) {
        return (
          <h4 key={index} className="font-semibold text-indigo-700 dark:text-indigo-400 mt-3 mb-1">
            {line.replace(/\*\*/g, '')}
          </h4>
        );
      }
      
      // Check if line starts with "Summary:" or "How you can use this:"
      if (line.startsWith('Summary:') || line.startsWith('How you can use this:')) {
        const [prefix, ...rest] = line.split(':');
        const content = rest.join(':');
        return (
          <div key={index} className="mt-3 mb-2">
            <span className="font-semibold text-indigo-600 dark:text-indigo-500">{prefix}:</span>
            <span className="text-gray-700 dark:text-gray-300">{content}</span>
          </div>
        );
      }
      
      // Regular line with a little margin if not empty
      if (line.trim()) {
        return <p key={index} className="mt-2 text-gray-600 dark:text-gray-400 leading-relaxed">{line}</p>;
      }
      
      // Empty line
      return <br key={index} />;
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          ref={searchInputRef}
          placeholder="Search local files, resources, topics, or categories..."
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
        <div className="mt-2 p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 z-20 relative">
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
      
      {!isSearching && (aiSummary || (searchResults && searchResults.length > 0)) && (
        <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded shadow z-10 relative">
          {aiSummary && showAiSummary && (
            <div className="mb-4 p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg relative overflow-hidden">
              <button 
                onClick={closeAiSummary}
                className="absolute right-2 top-2 h-6 w-6 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors shadow-sm"
                aria-label="Close AI summary"
              >
                <X className="h-4 w-4 text-gray-500 dark:text-gray-300" />
              </button>
              
              <div className="flex items-center mb-2">
                <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-800 flex items-center justify-center mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600 dark:text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-800 dark:text-gray-200">AI-Generated Summary</h3>
              </div>
              
              <div className="text-gray-600 dark:text-gray-300 text-sm mt-3 pl-10 pr-6">
                {formatAiSummary(aiSummary)}
              </div>
            </div>
          )}
          
          {searchResults && searchResults.length > 0 && (
            <>
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
                      <span>{resource.semester}th Semester</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          
          {searchResults && searchResults.length === 0 && !apiError && (
            <div className="p-4 text-center">
              <p className="text-gray-500">No local resources found matching your search criteria.</p>
            </div>
          )}
          
          {relatedQuestions.length > 0 && (
            <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
              <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">You might also be interested in:</h3>
              <ul className="space-y-1">
                {relatedQuestions.map((question, index) => (
                  <li 
                    key={index}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center"
                    onClick={() => handleRelatedQuestionClick(question)}
                  >
                    <Search className="h-3 w-3 mr-2" />
                    {question}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
