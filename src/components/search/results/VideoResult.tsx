
import React, { forwardRef } from 'react';
import { ExternalLink, Download, Youtube, Calendar, Eye } from 'lucide-react';
import { SearchResource } from '../../../types/faculty';
import { motion } from 'framer-motion';

interface VideoResultProps {
  result: SearchResource;
  saveResource: (result: SearchResource) => void;
}

const VideoResult = forwardRef<HTMLDivElement, VideoResultProps>(({ result, saveResource }, ref) => {
  return (
    <motion.div 
      ref={ref}
      className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white flex flex-col sm:flex-row"
    >
      <div className="relative w-full sm:w-40 h-48 sm:h-auto bg-gray-100 flex-shrink-0">
        {result.thumbnailUrl ? (
          <img 
            src={result.thumbnailUrl}
            alt={result.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-indigo-50">
            <Youtube className="h-10 w-10 text-indigo-300" />
          </div>
        )}
        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded flex items-center">
          <Youtube className="h-3 w-3 mr-1" />
          Video
        </div>
      </div>
      
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-lg font-medium text-indigo-700 mb-1.5 line-clamp-2">
          {result.title}
        </h3>
        
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {result.description || 'No description available'}
        </p>
        
        <div className="flex items-center text-xs text-gray-500 mb-3 space-x-4">
          {result.author && (
            <span className="flex items-center">
              <span className="w-4 h-4 rounded-full bg-gray-200 mr-1.5"></span>
              {result.author}
            </span>
          )}
          
          {result.publishDate && (
            <span className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              {new Date(result.publishDate).toLocaleDateString()}
            </span>
          )}
          
          {result.score && (
            <span className="flex items-center">
              <Eye className="h-3 w-3 mr-1" />
              {Math.round(result.score * 100)}% relevant
            </span>
          )}
        </div>
        
        <div className="flex mt-auto space-x-2">
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-800 px-3 py-1 rounded-md border border-indigo-200 hover:bg-indigo-50 text-sm flex items-center transition-colors flex-1 justify-center"
          >
            <Youtube className="h-4 w-4 mr-1.5" />
            Watch Video
          </a>
          
          <button
            onClick={() => saveResource(result)}
            className="text-green-600 hover:text-green-800 px-3 py-1 rounded-md border border-green-200 hover:bg-green-50 text-sm flex items-center transition-colors"
            title="Save to your resources"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
});

VideoResult.displayName = 'VideoResult';
export default VideoResult;
