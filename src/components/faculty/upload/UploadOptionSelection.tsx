
import { X, FolderPlus, Upload, Book, Briefcase, FolderOpen } from 'lucide-react';
import { SubjectFolder } from '../../../types/faculty.ts';

type UploadOption = 'semester' | 'placement' | 'subject-folder' | 'direct-upload';

interface UploadOptionSelectionProps {
  onSelectOption: (option: UploadOption) => void;
  onCancel: () => void;
  showAvailableSubjects: boolean;
  existingSubjects: SubjectFolder[];
}

export const UploadOptionSelection = ({
  onSelectOption,
  onCancel,
  showAvailableSubjects,
  existingSubjects,
}: UploadOptionSelectionProps) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Upload Workflow</h2>
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
          <X className="h-5 w-5" />
        </button>
      </div>

      <p className="text-gray-600">What type of content would you like to upload?</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => onSelectOption('semester')}
          className="flex flex-col items-center justify-center p-6 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
        >
          <Book className="h-12 w-12 text-indigo-500 mb-3" />
          <span className="text-gray-800 font-medium">Semester Resources</span>
          <span className="text-xs text-gray-500 mt-1">Upload to specific semester</span>
        </button>
        
        <button
          onClick={() => onSelectOption('placement')}
          className="flex flex-col items-center justify-center p-6 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors"
        >
          <Briefcase className="h-12 w-12 text-blue-500 mb-3" />
          <span className="text-gray-800 font-medium">Placement Resources</span>
          <span className="text-xs text-gray-500 mt-1">Career and placement documents</span>
        </button>
      </div>
      
      <div className="mt-8 border-t pt-6">
        <p className="text-gray-600 mb-4">Or choose one of these options:</p>
        
        <div className="flex space-x-4">
          <button
            onClick={() => onSelectOption('subject-folder')}
            className="flex items-center px-4 py-2 text-indigo-600 border border-indigo-200 rounded-md hover:bg-indigo-50"
          >
            <FolderPlus className="h-5 w-5 mr-2" />
            Create Subject Folders
          </button>
          
          <button
            onClick={() => onSelectOption('direct-upload')}
            className="flex items-center px-4 py-2 text-green-600 border border-green-200 rounded-md hover:bg-green-50"
          >
            <Upload className="h-5 w-5 mr-2" />
            Direct Upload
          </button>
        </div>
      </div>
      
      {/* Display existing subject folders if requested */}
      {showAvailableSubjects && existingSubjects.length > 0 && (
        <div className="mt-8 border-t pt-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Available Subject Folders</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {existingSubjects.map((subject, index) => (
              <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                <h4 className="font-medium text-gray-800">{subject.name || subject.subjectName}</h4>
                <p className="text-sm text-gray-600">Lecturer: {subject.lecturerName}</p>
                <p className="text-sm text-gray-600">Semester: {subject.semester}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
