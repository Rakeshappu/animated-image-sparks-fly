
import { forwardRef } from 'react';
import { ExternalLink, Download } from 'lucide-react';
import { SearchResource } from '../../../types/faculty';
import { motion } from 'framer-motion';

interface InfoResultProps {
  result: SearchResource;
  saveResource: (result: SearchResource) => void;
}

const InfoResult = forwardRef<HTMLDivElement, InfoResultProps>(({ result, saveResource }, ref) => {
  return (
    <motion.div 
      ref={ref}
      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
    >
      <div className="flex">
        <div className="flex-1">
          <h3 className="text-md font-medium text-indigo-700 mb-1.5">
            {result.title}
          </h3>
          
          <p className="text-sm text-gray-600 mb-2">
            {result.description || 'No description available'}
          </p>
          
          {result.source && (
            <p className="text-xs text-gray-500 mb-2">
              Source: {result.source}
            </p>
          )}
          
          <div className="flex mt-2 space-x-2">
            {result.url && (
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800 px-3 py-1 rounded-md border border-indigo-200 hover:bg-indigo-50 text-sm flex items-center transition-colors"
              >
                <ExternalLink className="h-4 w-4 mr-1.5" />
                Read More
              </a>
            )}
            
            {result.url && (
              <button
                onClick={() => saveResource(result)}
                className="text-green-600 hover:text-green-800 px-3 py-1 rounded-md border border-green-200 hover:bg-green-50 text-sm flex items-center transition-colors"
                title="Save to your resources"
              >
                <Download className="h-4 w-4 mr-1.5" />
                Save
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

InfoResult.displayName = 'InfoResult';
export default InfoResult;
