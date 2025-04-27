
import { useState } from 'react';
import { Upload, BookOpen, Briefcase, FolderPlus } from 'lucide-react';
import { SubjectFolder } from '../../../types/faculty';

interface UploadOptionSelectionProps {
  onSelectOption: (option: 'semester' | 'placement' | 'subject-folder' | 'direct-upload') => void;
  onCancel: () => void;
  showAvailableSubjects?: boolean;
  existingSubjects?: SubjectFolder[];
  selectedSemester?: number | null;
}

export const UploadOptionSelection = ({
  onSelectOption,
  onCancel,
  showAvailableSubjects = false,
  existingSubjects = [],
  selectedSemester = null
}: UploadOptionSelectionProps) => {
  const [hovered, setHovered] = useState<string | null>(null);
  
  const options = [
    {
      id: 'subject-folder',
      title: 'Create Subject Folders',
      description: 'Organize resources by creating subject folders first',
      icon: <FolderPlus className="h-8 w-8 text-indigo-600" />,
      color: 'bg-indigo-50'
    },
    {
      id: 'semester',
      title: 'Select Semester',
      description: selectedSemester 
        ? `Currently selected: Semester ${selectedSemester}` 
        : 'Choose a semester for your resources',
      icon: <BookOpen className="h-8 w-8 text-green-600" />,
      color: 'bg-green-50'
    },
    {
      id: 'placement',
      title: 'Placement Resources',
      description: 'Upload resources for placement preparation',
      icon: <Briefcase className="h-8 w-8 text-purple-600" />,
      color: 'bg-purple-50'
    },
    {
      id: 'direct-upload',
      title: 'Upload Directly',
      description: 'Skip organization and upload resources now',
      icon: <Upload className="h-8 w-8 text-blue-600" />,
      color: 'bg-blue-50'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">How would you like to organize your content?</h2>
        <p className="text-sm text-gray-500 mb-6">
          Choose an option to start the upload process
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {options.map((option) => (
          <div
            key={option.id}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
              ${hovered === option.id ? 'border-indigo-600 shadow-md' : 'border-gray-200'}
              ${option.color} hover:shadow-md`}
            onClick={() => onSelectOption(option.id as any)}
            onMouseEnter={() => setHovered(option.id)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="flex items-start space-x-4">
              <div className="p-2 rounded-full bg-white shadow-sm">
                {option.icon}
              </div>
              <div className="space-y-1">
                <h3 className="font-medium">{option.title}</h3>
                <p className="text-sm text-gray-500">{option.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {showAvailableSubjects && existingSubjects.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-medium mb-3">Available Subject Folders</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {existingSubjects.map((subject, idx) => (
              <div key={idx} className="text-sm bg-white p-2 rounded border">
                <span className="font-medium">{subject.name}</span>
                <span className="text-xs text-gray-500 ml-2">Semester {subject.semester}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex justify-end pt-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
