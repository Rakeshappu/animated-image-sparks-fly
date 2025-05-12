
import { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { Search, BookOpen, Loader2, ExternalLink, Download, X, Youtube, FileText, Info, Bookmark, Filter } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api.ts';
import { useAuth } from '../../contexts/AuthContext.ts';
import { SearchResource } from '../../types/faculty.ts';
import { motion, AnimatePresence } from 'framer-motion';

// Lazy loaded components
const VideoResult = lazy(() => import('./results/VideoResult.ts'));
const DocumentResult = lazy(() => import('./results/DocumentResult.ts'));
const InfoResult = lazy(() => import('./results/InfoResult.ts'));

interface EnhancedAISearchProps {
  initialSearchType?: 'educational' | 'placement' | 'videos' | 'documents';
}

export const EnhancedAISearch = ({ initialSearchType = 'educational' }: EnhancedAISearchProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResource[]>([]);
  const [searchType, setSearchType] = useState<string>(initialSearchType);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [aiSummary, setAiSummary] = useState('');
  const [filters, setFilters] = useState({
    recency: 'any',
    contentType: 'all',
  });
  
  const observer = useRef<IntersectionObserver | null>(null);
  const lastResultElementRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  
  // Disconnect observer on unmount
  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);
  
  // Setup intersection observer for infinite scrolling
  useEffect(() => {
    if (isLoading) return;
    
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreResults();
      }
    });
    
    if (lastResultElementRef.current) {
      observer.current.observe(lastResultElementRef.current);
    }
  }, [results, isLoading, hasMore]);
  
  const loadMoreResults = () => {
    if (!isLoading && hasMore) {
      setPage(prevPage => prevPage + 1);
      performSearch(query, searchType, page + 1);
    }
  };
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }
    
    // Reset pagination
    setPage(1);
    setResults([]);
    setHasMore(false);
    setTotalResults(0);
    setShowResults(true);
    
    performSearch(query, searchType, 1, true);
  };
  
  const performSearch = async (searchQuery: string, type: string, pageNum: number, isNewSearch = false) => {
    if (isNewSearch) {
      setIsLoading(true);
      setAiSummary('');
    }
    
    try {
      // First try specialized search based on type
      let searchResults;
      let aiData = null;
      
      const searchParams = new URLSearchParams({
        q: searchQuery,
        type,
        page: pageNum.toString(),
        limit: '10',
        recency: filters.recency,
        contentType: filters.contentType
      });
      
      // Use the enhanced AI search endpoint
      const response = await api.get(`/api/search/enhanced?${searchParams}`);
      
      searchResults = response.data.results || [];
      setTotalResults(response.data.total || 0);
      setHasMore(pageNum < (response.data.totalPages || 1));
      
      // If AI summary is available and this is a new search
      if (response.data.aiSummary && isNewSearch) {
        setAiSummary(response.data.aiSummary);
      }
      
      // Append or replace results
      if (isNewSearch) {
        setResults(searchResults);
      } else {
        setResults(prev => [...prev, ...searchResults]);
      }
      
      // Track search in user history if authenticated
      if (user) {
        try {
          await api.post('/api/user/search-history', {
            query: searchQuery,
            type,
            resultCount: searchResults.length
          });
        } catch (error) {
          console.warn('Failed to save search history:', error);
        }
      }
      
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed. Please try again later.');
    } finally {
      if (isNewSearch) {
        setIsLoading(false);
      }
    }
  };
  
  const saveResource = async (result: SearchResource) => {
    if (!user) {
      toast.error('Please log in to save resources');
      return;
    }
    
    try {
      const response = await api.post('/api/resources', {
        title: result.title,
        description: result.description || 'No description available',
        type: result.type === 'video' ? 'video' : 'link',
        subject: searchType === 'placement' ? 'Placement Preparation' : 'Study Materials',
        semester: 1,
        link: result.url,
        category: searchType === 'placement' ? 'placement' : 'study'
      });
      
      if (response.data.success) {
        toast.success('Resource saved to your library');
      }
    } catch (error) {
      console.error('Error saving resource:', error);
      toast.error('Failed to save resource');
    }
  };
  
  const toggleFilters = () => {
    setFilterOpen(!filterOpen);
  };
  
  const applyFilters = () => {
    setPage(1);
    setResults([]);
    handleSearch(new Event('submit') as any);
    setFilterOpen(false);
  };
  
  const getResultComponent = (result: SearchResource, index: number) => {
    const isLastElement = index === results.length - 1;
    const ref = isLastElement ? lastResultElementRef : null;
    
    if (result.type === 'video') {
      return (
        <Suspense fallback={<div className="h-52 bg-gray-100 animate-pulse rounded-lg"></div>}>
          <VideoResult result={result} saveResource={saveResource} ref={ref} />
        </Suspense>
      );
    } else if (result.type === 'document' || result.type === 'pdf' || result.type === 'link') {
      return (
        <Suspense fallback={<div className="h-36 bg-gray-100 animate-pulse rounded-lg"></div>}>
          <DocumentResult result={result} saveResource={saveResource} ref={ref} />
        </Suspense>
      );
    } else {
      return (
        <Suspense fallback={<div className="h-28 bg-gray-100 animate-pulse rounded-lg"></div>}>
          <InfoResult result={result} saveResource={saveResource} ref={ref} />
        </Suspense>
      );
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <Search className="h-5 w-5 mr-2 text-indigo-500" />
        Educational AI Search
      </h2>
      
      <div className="mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <button
            className={`px-3 py-2 rounded-md text-sm flex items-center justify-center ${
              searchType === 'educational' 
                ? 'bg-indigo-100 text-indigo-700 border border-indigo-300' 
                : 'bg-gray-100 text-gray-700 border border-gray-300'
            }`}
            onClick={() => setSearchType('educational')}
          >
            <BookOpen className="h-4 w-4 mr-1.5" />
            <span>All Resources</span>
          </button>
          
          <button
            className={`px-3 py-2 rounded-md text-sm flex items-center justify-center ${
              searchType === 'videos' 
                ? 'bg-indigo-100 text-indigo-700 border border-indigo-300' 
                : 'bg-gray-100 text-gray-700 border border-gray-300'
            }`}
            onClick={() => setSearchType('videos')}
          >
            <Youtube className="h-4 w-4 mr-1.5" />
            <span>Videos</span>
          </button>
          
          <button
            className={`px-3 py-2 rounded-md text-sm flex items-center justify-center ${
              searchType === 'documents' 
                ? 'bg-indigo-100 text-indigo-700 border border-indigo-300' 
                : 'bg-gray-100 text-gray-700 border border-gray-300'
            }`}
            onClick={() => setSearchType('documents')}
          >
            <FileText className="h-4 w-4 mr-1.5" />
            <span>Documents</span>
          </button>
          
          <button
            className={`px-3 py-2 rounded-md text-sm flex items-center justify-center ${
              searchType === 'placement' 
                ? 'bg-indigo-100 text-indigo-700 border border-indigo-300' 
                : 'bg-gray-100 text-gray-700 border border-gray-300'
            }`}
            onClick={() => setSearchType('placement')}
          >
            <Bookmark className="h-4 w-4 mr-1.5" />
            <span>Placement</span>
          </button>
        </div>
        
        <form onSubmit={handleSearch} className="flex mb-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search for educational resources, courses, videos..."
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-l-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button
            type="button"
            onClick={toggleFilters}
            className="px-3 bg-gray-100 border-y border-r border-gray-300 text-gray-600 hover:bg-gray-200"
          >
            <Filter className="h-5 w-5" />
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 border border-transparent rounded-r-md shadow-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              'Search'
            )}
          </button>
        </form>
        
        <AnimatePresence>
          {filterOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Time Range</h3>
                    <div className="space-y-2">
                      {['any', 'day', 'week', 'month', 'year'].map((period) => (
                        <label key={period} className="flex items-center">
                          <input
                            type="radio"
                            name="recency"
                            className="form-radio h-4 w-4 text-indigo-600"
                            checked={filters.recency === period}
                            onChange={() => setFilters({...filters, recency: period})}
                          />
                          <span className="ml-2 text-gray-700 text-sm capitalize">
                            {period === 'any' ? 'Any time' : `Past ${period}`}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Content Type</h3>
                    <div className="space-y-2">
                      {[
                        { id: 'all', label: 'All Types' },
                        { id: 'video', label: 'Videos' },
                        { id: 'document', label: 'Documents & PDFs' },
                        { id: 'course', label: 'Courses' },
                        { id: 'article', label: 'Articles' }
                      ].map((type) => (
                        <label key={type.id} className="flex items-center">
                          <input
                            type="radio"
                            name="contentType"
                            className="form-radio h-4 w-4 text-indigo-600"
                            checked={filters.contentType === type.id}
                            onChange={() => setFilters({...filters, contentType: type.id})}
                          />
                          <span className="ml-2 text-gray-700 text-sm">{type.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors text-sm"
                    onClick={applyFilters}
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
            <p className="mt-4 text-gray-600">Searching educational resources...</p>
          </div>
        </div>
      )}
      
      {!isLoading && aiSummary && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100"
        >
          <div className="flex items-start">
            <div className="mt-1 mr-3 flex-shrink-0">
              <Info className="h-5 w-5 text-indigo-500" />
            </div>
            <div>
              <h3 className="text-md font-medium text-indigo-800 mb-1.5">AI Summary</h3>
              <p className="text-sm text-gray-700 leading-relaxed">{aiSummary}</p>
            </div>
          </div>
        </motion.div>
      )}
      
      {!isLoading && results.length > 0 && showResults && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-800">
              {totalResults > 0 ? `${totalResults} results found` : `${results.length} results`}
            </h3>
            <button 
              onClick={() => setShowResults(false)} 
              className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label="Close results"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>
          
          <div className="space-y-4">
            {results.map((result, index) => (
              <motion.div
                key={`${result.id || index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.05, 0.5) }}
              >
                {getResultComponent(result, index)}
              </motion.div>
            ))}
          </div>
          
          {hasMore && (
            <div className="flex justify-center py-4">
              <button
                onClick={loadMoreResults}
                className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors flex items-center"
              >
                <Loader2 className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Load More Results
              </button>
            </div>
          )}
        </div>
      )}
      
      {!isLoading && query && results.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No results found</h3>
          <p className="mt-2 text-sm text-gray-500">
            Try adjusting your search terms or search for a different topic.
          </p>
        </div>
      )}
    </div>
  );
};

export default EnhancedAISearch;
