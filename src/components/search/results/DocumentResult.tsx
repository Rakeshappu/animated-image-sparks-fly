import { forwardRef } from 'react';
import { ExternalLink, Download, FileText, Calendar, Link as LinkIcon } from 'lucide-react';
import { SearchResource } from '../../../types/faculty';
import { motion } from 'framer-motion';

interface DocumentResultProps {
  result: SearchResource;
  saveResource: (result: SearchResource) => void;
}

const DocumentResult = forwardRef<HTMLDivElement, DocumentResultProps>(({ result, saveResource }, ref) => {
  // Function to get icon based on result type or URL
  const getDocumentIcon = () => {
    const url = result.url?.toLowerCase() || '';
    
    if (result.type === 'pdf' || url.includes('.pdf')) {
      return <FileText className="h-6 w-6 text-red-500" />;
    } else if (url.includes('.doc') || url.includes('.docx')) {
      return <FileText className="h-6 w-6 text-blue-500" />;
    } else if (url.includes('.ppt') || url.includes('.pptx')) {
      return <FileText className="h-6 w-6 text-orange-500" />;
    } else if (url.includes('.xls') || url.includes('.xlsx')) {
      return <FileText className="h-6 w-6 text-green-500" />;
    } else {
      return <LinkIcon className="h-6 w-6 text-indigo-500" />;
    }
  };
  
  return (
    <motion.div 
      ref={ref}
      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
    >
      <div className="flex items-start">
        <div className="p-3 bg-gray-50 rounded-lg mr-4 flex-shrink-0">
          {getDocumentIcon()}
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-medium text-indigo-700 mb-1.5 line-clamp-2">
            {result.title}
          </h3>
          
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {result.description || 'No description available'}
          </p>
          
          <div className="flex items-center text-xs text-gray-500 mb-3">
            {result.source && (
              <span className="mr-3">{result.source}</span>
            )}
            
            {result.publishedDate && (
              <span className="flex items-center mr-3">
                <Calendar className="h-3 w-3 mr-1" />
                {new Date(result.publishedDate).toLocaleDateString()}
              </span>
            )}
          </div>
          
          <div className="flex mt-2 space-x-2">
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-800 px-3 py-1 rounded-md border border-indigo-200 hover:bg-indigo-50 text-sm flex items-center transition-colors"
            >
              <ExternalLink className="h-4 w-4 mr-1.5" />
              View Document
            </a>
            
            <button
              onClick={() => saveResource(result)}
              className="text-green-600 hover:text-green-800 px-3 py-1 rounded-md border border-green-200 hover:bg-green-50 text-sm flex items-center transition-colors"
              title="Save to your resources"
            >
              <Download className="h-4 w-4 mr-1.5" />
              Save
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

DocumentResult.displayName = 'DocumentResult';
export default DocumentResult;
