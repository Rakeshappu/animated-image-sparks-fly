
import { Folder, Book, Eye } from 'lucide-react';
import { FacultyResource } from '../../types/faculty';
import { useNavigate } from 'react-router-dom';

interface SubjectFolderProps {
  subject: string;
  resources: FacultyResource[];
  sortBy: 'recent' | 'popular' | 'alphabetical';
}

export const SubjectFolder = ({ subject, resources, sortBy }: SubjectFolderProps) => {
  const navigate = useNavigate();
  
  const navigateToSubject = () => {
    // Navigate to a dedicated page for this subject
    navigate(`/study/${encodeURIComponent(subject)}`);
  };
  
  // Calculate folder metrics
  const totalViews = resources.reduce((sum, resource) => sum + resource.stats.views, 0);
  const resourceCount = resources.length;

  return (
    <div 
      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-all" 
      onClick={navigateToSubject}
    >
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center">
          <div className="bg-indigo-100 p-2 rounded-lg">
            <Folder className="h-6 w-6 text-indigo-600" />
          </div>
          <div className="ml-3">
            <h3 className="font-semibold text-gray-800">{subject}</h3>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <span className="flex items-center">
                <Book className="h-4 w-4 mr-1" />
                <span>{resourceCount} {resourceCount === 1 ? 'item' : 'items'}</span>
              </span>
              <span className="mx-2">•</span>
              <div className="flex items-center">
                <Eye className="h-4 w-4 mr-1" />
                <span>{totalViews} {totalViews === 1 ? 'view' : 'views'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
