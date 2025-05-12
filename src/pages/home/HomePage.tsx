
import { Suspense, lazy, useState, useEffect } from 'react';
import { Loader2, BookOpen, Youtube, FileText, Search, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

// Lazy loaded components
const EnhancedAISearch = lazy(() => import('../../components/search/EnhancedAISearch'));
const PaginatedResourceList = lazy(() => import('../../components/resources/PaginatedResourceList'));
const QuickAccess = lazy(() => import('../../components/resources/QuickAccess'));

// Import service
import  getResources  from '../../services/resource.service';

export const HomePage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch resources on component mount
  useEffect(() => {
    const fetchResourcesData = async () => {
      try {
        setIsLoading(true);
        const data = await getResources();
        if (Array.isArray(data)) {
          setResources(data);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching resources:', error);
        setIsLoading(false);
      }
    };

    fetchResourcesData();
  }, []);

  const fetchPagedResources = async (page: number, limit: number, filters: any = {}) => {
    try {
      setIsLoading(true);
      const resources = await getResources();
      
      setIsLoading(false);
      return {
        resources: Array.isArray(resources) ? resources : [],
        total: Array.isArray(resources) ? resources.length : 0,
        totalPages: Array.isArray(resources) ? Math.ceil(resources.length / limit) : 1
      };
    } catch (error) {
      console.error('Error fetching resources:', error);
      setIsLoading(false);
      return { resources: [], total: 0, totalPages: 1 };
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Learning Portal</h1>
            <p className="mt-1 text-gray-500">
              Discover and access educational resources to enhance your learning
            </p>
          </div>
        </div>
      </header>

      <div className="mb-6">
        <nav className="flex overflow-x-auto pb-1 border-b border-gray-200">
          <button
            className={`px-4 py-2 border-b-2 font-medium text-sm ${
              activeTab === 'dashboard'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('dashboard')}
          >
            <BookOpen className="inline-block h-4 w-4 mr-2" />
            Dashboard
          </button>
          <button
            className={`px-4 py-2 border-b-2 font-medium text-sm ${
              activeTab === 'search'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('search')}
          >
            <Search className="inline-block h-4 w-4 mr-2" />
            Advanced Search
          </button>
          <button
            className={`px-4 py-2 border-b-2 font-medium text-sm ${
              activeTab === 'videos'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('videos')}
          >
            <Youtube className="inline-block h-4 w-4 mr-2" />
            Educational Videos
          </button>
          <button
            className={`px-4 py-2 border-b-2 font-medium text-sm ${
              activeTab === 'documents'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('documents')}
          >
            <FileText className="inline-block h-4 w-4 mr-2" />
            Course Materials
          </button>
          <button
            className={`px-4 py-2 border-b-2 font-medium text-sm ${
              activeTab === 'competitive'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('competitive')}
          >
            <Terminal className="inline-block h-4 w-4 mr-2" />
            Competitive Programming
          </button>
        </nav>
      </div>

      <main>
        {activeTab === 'dashboard' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-8">
              <Suspense fallback={<div className="h-24 bg-gray-100 animate-pulse rounded-lg"></div>}>
                <QuickAccess />
              </Suspense>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <h2 className="text-xl font-semibold mb-4">Recent Resources</h2>
                <Suspense fallback={<div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>}>
                  <PaginatedResourceList 
                    fetchResources={fetchPagedResources}
                    initialFilters={{ sortOrder: 'newest' }}
                    pageSize={8}
                    showFilters={false}
                  />
                </Suspense>
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-4">Quick Search</h2>
                <Suspense fallback={<div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>}>
                  <EnhancedAISearch initialSearchType="educational" />
                </Suspense>
              </div>
            </div>

            {/* Competitive Programming Card */}
            <div className="mt-8">
              <Link 
                to="/competitive-programming"
                className="block p-6 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-lg shadow-md transition-all duration-200 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Competitive Programming</h3>
                    <p className="text-blue-100">
                      Access coding challenges, algorithms, and practice resources to improve your programming skills
                    </p>
                  </div>
                  <div className="bg-white bg-opacity-20 p-3 rounded-full">
                    <Terminal className="h-8 w-8 text-white" />
                  </div>
                </div>
              </Link>
            </div>
          </motion.div>
        )}

        {activeTab === 'search' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Suspense fallback={
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                <span className="ml-2 text-gray-600">Loading advanced search...</span>
              </div>
            }>
              <EnhancedAISearch initialSearchType="educational" />
            </Suspense>
          </motion.div>
        )}

        {activeTab === 'videos' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Suspense fallback={
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                <span className="ml-2 text-gray-600">Loading videos...</span>
              </div>
            }>
              <EnhancedAISearch initialSearchType="videos" />
            </Suspense>
          </motion.div>
        )}

        {activeTab === 'documents' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Suspense fallback={
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                <span className="ml-2 text-gray-600">Loading documents...</span>
              </div>
            }>
              <EnhancedAISearch initialSearchType="documents" />
            </Suspense>
          </motion.div>
        )}

        {activeTab === 'competitive' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center py-12">
              <Terminal className="h-16 w-16 mx-auto text-indigo-600 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Competitive Programming Resources</h2>
              <p className="text-gray-600 mb-6 max-w-lg mx-auto">
                Access coding challenges, algorithms, and practice resources to enhance your programming skills
              </p>
              <Link 
                to="/competitive-programming"
                className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                Explore Resources
              </Link>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default HomePage;
