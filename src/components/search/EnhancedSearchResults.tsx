import { SearchResource } from "../../types/faculty.ts";
import { useState, useRef } from 'react';
import { ExternalLink, FileText, Video, Globe, X } from "lucide-react";
import { motion } from "framer-motion";

interface EnhancedSearchResultsProps {
  results: SearchResource[];
  isLoading: boolean;
  query: string;
  aiSummary?: string;
  onClose: () => void;
  onSaveResource?: (resource: SearchResource) => void;
}

const EnhancedSearchResults = ({
  results,
  isLoading,
  query,
  aiSummary,
  onClose,
  onSaveResource
}: EnhancedSearchResultsProps) => {
  const [activeTab, setActiveTab] = useState<'all' | 'web' | 'videos' | 'documents'>('all');
  const resultsRef = useRef<HTMLDivElement>(null);

  // Filter results based on the active tab
  const filteredResults = results.filter(result => {
    if (activeTab === 'all') return true;
    if (activeTab === 'web' && result.type !== 'video' && result.type !== 'pdf' && result.type !== 'document') return true;
    if (activeTab === 'videos' && result.type === 'video') return true;
    if (activeTab === 'documents' && (result.type === 'document' || result.type === 'pdf')) return true;
    return false;
  });

  // Group results by type for the segmented view
  const videoResults = results.filter(r => r.type === 'video').slice(0, 3);
  const documentResults = results.filter(r => r.type === 'document' || r.type === 'pdf').slice(0, 3);
  const webResults = results.filter(r => r.type !== 'video' && r.type !== 'document' && r.type !== 'pdf').slice(0, 3);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="fixed z-50 inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20">
        <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Search Results for "{query}"</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
              <X size={20} />
            </button>
          </div>
          <div className="flex justify-center my-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed z-50 inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-16">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        ref={resultsRef}
        className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] overflow-y-auto shadow-xl"
      >
        <div className="sticky top-0 bg-white p-4 border-b border-gray-200 z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Search Results for "{query}"</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="mt-4">
            <div className="flex border border-gray-200 rounded-md overflow-hidden">
              <button 
                className={`py-2 px-4 text-sm font-medium ${activeTab === 'all' ? 'bg-gray-100 text-gray-900' : 'bg-white text-gray-500'}`}
                onClick={() => setActiveTab('all')}
              >
                All Results
              </button>
              <button 
                className={`py-2 px-4 text-sm font-medium ${activeTab === 'web' ? 'bg-gray-100 text-gray-900' : 'bg-white text-gray-500'}`}
                onClick={() => setActiveTab('web')}
              >
                Web
              </button>
              <button 
                className={`py-2 px-4 text-sm font-medium ${activeTab === 'videos' ? 'bg-gray-100 text-gray-900' : 'bg-white text-gray-500'}`}
                onClick={() => setActiveTab('videos')}
              >
                Videos
              </button>
              <button 
                className={`py-2 px-4 text-sm font-medium ${activeTab === 'documents' ? 'bg-gray-100 text-gray-900' : 'bg-white text-gray-500'}`}
                onClick={() => setActiveTab('documents')}
              >
                Documents
              </button>
            </div>
          </div>
        </div>
        
        {aiSummary && activeTab === 'all' && (
          <div className="p-4 m-4 bg-indigo-50 border border-indigo-100 rounded-lg">
            <div className="flex items-start">
              <div className="bg-indigo-100 rounded-full p-2 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-md font-medium text-indigo-800">AI-Generated Answer</h3>
                <p className="text-sm text-gray-700 mt-1">{aiSummary}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'all' ? (
          <div className="p-4">
            {results.length > 0 ? (
              <>
                {/* Top Videos Section */}
                {videoResults.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold flex items-center">
                        <Video className="h-5 w-5 text-red-500 mr-2" />
                        Top Videos
                      </h3>
                      {results.filter(r => r.type === 'video').length > 3 && (
                        <button 
                          className="text-sm text-indigo-600 hover:text-indigo-800"
                          onClick={() => setActiveTab('videos')}
                        >
                          View all videos
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {videoResults.map((video, index) => (
                        <a 
                          key={video.id || index} 
                          href={video.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                        >
                          <div className="relative bg-gray-100 pb-[56.25%]"> {/* 16:9 aspect ratio */}
                            {video.thumbnailUrl ? (
                              <img 
                                src={video.thumbnailUrl} 
                                alt={video.title} 
                                className="absolute top-0 left-0 w-full h-full object-cover"
                              />
                            ) : (
                              <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-200">
                                <Video className="h-10 w-10 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <h4 className="font-medium text-sm line-clamp-2">{video.title}</h4>
                            <p className="text-xs text-gray-500 mt-1">{video.author || video.source}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Documents Section */}
                {documentResults.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold flex items-center">
                        <FileText className="h-5 w-5 text-blue-500 mr-2" />
                        Documents
                      </h3>
                      {results.filter(r => r.type === 'document' || r.type === 'pdf').length > 3 && (
                        <button 
                          className="text-sm text-indigo-600 hover:text-indigo-800"
                          onClick={() => setActiveTab('documents')}
                        >
                          View all documents
                        </button>
                      )}
                    </div>
                    <div className="divide-y divide-gray-100">
                      {documentResults.map((doc, index) => (
                        <div key={doc.id || index} className="py-3">
                          <div className="flex items-start">
                            <div className="p-2 bg-blue-50 rounded mr-3">
                              <FileText className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                              <a 
                                href={doc.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="font-medium hover:text-indigo-600"
                              >
                                {doc.title}
                              </a>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{doc.description}</p>
                              <div className="flex items-center mt-1">
                                <span className="text-xs text-gray-500">{doc.source}</span>
                                {doc.publishedDate && (
                                  <>
                                    <span className="mx-1 text-gray-300">•</span>
                                    <span className="text-xs text-gray-500">{formatDate(doc.publishedDate)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            {onSaveResource && (
                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  onSaveResource(doc);
                                }}
                                className="ml-auto p-1.5 text-gray-400 hover:text-indigo-600"
                                title="Save to library"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Web Results Section */}
                {webResults.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold flex items-center">
                        <Globe className="h-5 w-5 text-green-500 mr-2" />
                        Web Results
                      </h3>
                      {results.filter(r => r.type !== 'video' && r.type !== 'document' && r.type !== 'pdf').length > 3 && (
                        <button 
                          className="text-sm text-indigo-600 hover:text-indigo-800"
                          onClick={() => setActiveTab('web')}
                        >
                          View all web results
                        </button>
                      )}
                    </div>
                    <div className="divide-y divide-gray-100">
                      {webResults.map((webResult, index) => (
                        <div key={webResult.id || index} className="py-3">
                          <div>
                            <a 
                              href={webResult.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="font-medium hover:text-indigo-600"
                            >
                              {webResult.title}
                            </a>
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <span className="truncate max-w-xs">{webResult.url}</span>
                              {onSaveResource && (
                                <button 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onSaveResource(webResult);
                                  }}
                                  className="ml-auto p-1.5 text-gray-400 hover:text-indigo-600"
                                  title="Save to library"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                  </svg>
                                </button>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{webResult.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No results found</h3>
                <p className="mt-1 text-gray-500">Try adjusting your search terms</p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4">
            {filteredResults.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {filteredResults.map((result, index) => {
                  if (result.type === 'video' && activeTab === 'videos') {
                    return (
                      <div key={result.id || index} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row">
                          <div className="sm:w-1/3 bg-gray-100">
                            {result.thumbnailUrl ? (
                              <img 
                                src={result.thumbnailUrl} 
                                alt={result.title} 
                                className="w-full h-full object-cover"
                                style={{ maxHeight: '160px' }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-200" style={{ minHeight: '160px' }}>
                                <Video className="h-12 w-12 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="p-4 sm:w-2/3">
                            <a 
                              href={result.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="font-medium hover:text-indigo-600 block mb-2"
                            >
                              {result.title}
                            </a>
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{result.description}</p>
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-xs text-gray-500">{result.source || 'Unknown source'}</span>
                                {result.publishedDate && (
                                  <>
                                    <span className="mx-1 text-gray-300">•</span>
                                    <span className="text-xs text-gray-500">{formatDate(result.publishedDate)}</span>
                                  </>
                                )}
                              </div>
                              {onSaveResource && (
                                <button 
                                  onClick={() => onSaveResource(result)}
                                  className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                  </svg>
                                  Save
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  } else if ((result.type === 'document' || result.type === 'pdf') && activeTab === 'documents') {
                    return (
                      <div key={result.id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start">
                          <div className="p-2 bg-blue-50 rounded mr-3">
                            <FileText className="h-6 w-6 text-blue-500" />
                          </div>
                          <div className="flex-1">
                            <a 
                              href={result.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="font-medium hover:text-indigo-600"
                            >
                              {result.title}
                            </a>
                            <p className="text-sm text-gray-600 mt-1">{result.description}</p>
                            <div className="flex items-center justify-between mt-3">
                              <div>
                                <span className="text-xs text-gray-500">{result.source || 'Unknown source'}</span>
                                {result.publishedDate && (
                                  <>
                                    <span className="mx-1 text-gray-300">•</span>
                                    <span className="text-xs text-gray-500">{formatDate(result.publishedDate)}</span>
                                  </>
                                )}
                              </div>
                              {onSaveResource && (
                                <button 
                                  onClick={() => onSaveResource(result)}
                                  className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                  </svg>
                                  Save
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  } else if (result.type !== 'video' && result.type !== 'document' && result.type !== 'pdf' && activeTab === 'web') {
                    return (
                      <div key={result.id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <a 
                          href={result.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-medium hover:text-indigo-600"
                        >
                          {result.title}
                        </a>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <Globe className="h-3.5 w-3.5 mr-1 text-gray-400" />
                          <span className="truncate max-w-md">{result.url}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{result.description}</p>
                        {onSaveResource && (
                          <div className="mt-3 flex justify-end">
                            <button 
                              onClick={() => onSaveResource(result)}
                              className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                              </svg>
                              Save
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No {activeTab} results found</h3>
                <p className="mt-1 text-gray-500">Try adjusting your search terms or checking another category</p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default EnhancedSearchResults;