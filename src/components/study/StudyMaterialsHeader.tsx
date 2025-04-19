
import { BookOpen, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StudyMaterialsHeaderProps {
  selectedSemester: number;
  onSemesterChange: (semester: number) => void;
  sortBy: 'recent' | 'popular' | 'alphabetical';
  onSortChange: (sortBy: string) => void;
  availableSemesters?: number[]; // Added this prop
}

export const StudyMaterialsHeader = ({ 
  selectedSemester, 
  onSemesterChange,
  sortBy,
  onSortChange,
  availableSemesters = [1, 2, 3, 4, 5, 6, 7, 8] // Default to all semesters
}: StudyMaterialsHeaderProps) => {
  const navigate = useNavigate();
  
  const goToPlacementResources = () => {
    navigate('/placement');
  };
  
  return (
    <div className="mt-8">
      <div className="flex items-center mb-4">
        <BookOpen className="h-6 w-6 text-indigo-600 mr-2" />
        <h1 className="text-2xl font-bold text-gray-800">Study Materials</h1>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 mb-6">
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((semester) => {
            // Only show semesters that are available to the user
            const isAvailable = availableSemesters.includes(semester);
            return isAvailable ? (
              <button
                key={semester}
                onClick={() => onSemesterChange(semester)}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  selectedSemester === semester
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Semester {semester}
              </button>
            ) : null;
          })}
          <button
            onClick={goToPlacementResources}
            className="px-4 py-2 rounded-full text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 flex items-center"
          >
            <Briefcase className="h-4 w-4 mr-1" />
            Placement Resources
          </button>
        </div>
        
        <select
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
        >
          <option value="recent">Recently Added</option>
          <option value="popular">Most Popular</option>
          <option value="alphabetical">Alphabetical</option>
        </select>
      </div>
    </div>
  );
};
