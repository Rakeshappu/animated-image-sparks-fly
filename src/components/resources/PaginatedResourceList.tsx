
import { useState, useEffect, useRef } from 'react';
import { FacultyResource } from '../../types/faculty';
import { ResourceCard } from './ResourceCard';
import { Loader2, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginatedResourceListProps {
  fetchResources: (page: number, limit: number, filters?: any) => Promise<{
    resources: FacultyResource[];
    total: number;
    totalPages: number;
  }>;
  initialFilters?: any;
  pageSize?: number;
  showFilters?: boolean;
}

export const PaginatedResourceList = ({
  fetchResources,
  initialFilters = {},
  pageSize = 12,
  showFilters = true
}: PaginatedResourceListProps) => {
  const [resources, setResources] = useState<FacultyResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResources, setTotalResources] = useState(0);
  const [filters, setFilters] = useState(initialFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  const listRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    loadResources();
  }, [page, filters]);
  
  const loadResources = async () => {
    try {
      setLoading(true);
      const response = await fetchResources(page, pageSize, filters);
      
      setResources(response.resources);
      setTotalPages(response.totalPages);
      setTotalResources(response.total);
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const applyFilters = (newFilters: any) => {
    setFilters({...filters, ...newFilters});
    setPage(1); // Reset to first page when filters change
  };
  
  const goToPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      // Scroll to top of list when changing pages
      if (listRef.current) {
        listRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };
  
  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    const startPage = Math.max(1, Math.min(
      page - Math.floor(maxVisiblePages / 2),
      totalPages - maxVisiblePages + 1
    ));
    
    const endPage = Math.min(startPage + maxVisiblePages - 1, totalPages);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          className={`px-3 py-1 mx-1 rounded ${
            page === i
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          onClick={() => goToPage(i)}
        >
          {i}
        </button>
      );
    }
    
    return (
      <div className="flex items-center justify-center mt-6">
        <button
          className="p-1 rounded bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          onClick={() => goToPage(page - 1)}
          disabled={page === 1}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        
        {startPage > 1 && (
          <>
            <button 
              className="px-3 py-1 mx-1 rounded bg-white text-gray-700 hover:bg-gray-100"
              onClick={() => goToPage(1)}
            >
              1
            </button>
            {startPage > 2 && <span className="mx-1">...</span>}
          </>
        )}
        
        {pages}
        
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="mx-1">...</span>}
            <button 
              className="px-3 py-1 mx-1 rounded bg-white text-gray-700 hover:bg-gray-100"
              onClick={() => goToPage(totalPages)}
            >
              {totalPages}
            </button>
          </>
        )}
        
        <button
          className="p-1 rounded bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          onClick={() => goToPage(page + 1)}
          disabled={page === totalPages}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    );
  };
  
  const toggleFilters = () => {
    setFiltersOpen(!filtersOpen);
  };
  
  return (
    <div ref={listRef} className="w-full">
      {showFilters && (
        <div className="mb-4">
          <button
            onClick={toggleFilters}
            className="flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100"
          >
            <Filter className="h-4 w-4 mr-2" />
            {filtersOpen ? 'Hide Filters' : 'Show Filters'}
          </button>
          
          {filtersOpen && (
            <div className="mt-3 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Resource Type
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-md p-2"
                    value={filters.type || ''}
                    onChange={(e) => applyFilters({ type: e.target.value || undefined })}
                  >
                    <option value="">All Types</option>
                    <option value="document">Documents</option>
                    <option value="video">Videos</option>
                    <option value="link">Links</option>
                    <option value="note">Notes</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Semester
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-md p-2"
                    value={filters.semester || ''}
                    onChange={(e) => applyFilters({ semester: e.target.value ? Number(e.target.value) : undefined })}
                  >
                    <option value="">All Semesters</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort By
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-md p-2"
                    value={filters.sortOrder || 'newest'}
                    onChange={(e) => applyFilters({ sortOrder: e.target.value })}
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="popular">Most Popular</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <button
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                  onClick={() => loadResources()}
                >
                  Apply Filters
                </button>
                <button
                  className="ml-2 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                  onClick={() => {
                    setFilters(initialFilters);
                    setPage(1);
                  }}
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="mb-4 text-sm text-gray-500">
        Showing {resources.length} of {totalResources} resources
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <span className="ml-2 text-gray-600">Loading resources...</span>
        </div>
      ) : resources.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {resources.map(resource => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
          
          {totalPages > 1 && renderPagination()}
        </>
      ) : (
        <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25M9 16.5v.75m3-3v3M15 12v5.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No resources found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try changing your search criteria or filters.
          </p>
        </div>
      )}
    </div>
  );
};

export default PaginatedResourceList;
