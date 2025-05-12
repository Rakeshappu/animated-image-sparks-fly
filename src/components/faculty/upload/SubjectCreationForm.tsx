import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { SubjectData, SubjectFolder } from '../../../types/faculty';
import { toast } from 'react-hot-toast';

interface SubjectCreationFormProps {
  selectedSemester: number | null;
  onBack: () => void;
  onSkipToUpload: () => void;
  onCreateSubjectFolders: (subjects: SubjectData[]) => void;
  existingSubjectsForSemester: SubjectFolder[];
  showAvailableSubjects: boolean;
}

export const SubjectCreationForm = ({
  selectedSemester,
  onBack,
  onSkipToUpload,
  onCreateSubjectFolders,
  existingSubjectsForSemester,
  showAvailableSubjects
}: SubjectCreationFormProps) => {
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [currentSubject, setCurrentSubject] = useState<SubjectData>({
    name: '', // Add name property to match SubjectData interface
    subjectName: '',
    lecturerName: '',
    semester: selectedSemester || 1
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Reset form error when inputs change
  useEffect(() => {
    if (formError) {
      setFormError(null);
    }
  }, [currentSubject.subjectName, currentSubject.lecturerName, formError]);

  const handleAddSubject = () => {
    // Validate inputs
    if (!currentSubject.subjectName || currentSubject.subjectName.trim() === '') {
      setFormError('Subject name is required');
      return;
    }
    
    if (!currentSubject.lecturerName || currentSubject.lecturerName.trim() === '') {
      setFormError('Lecturer name is required');
      return;
    }

    // Copy name from subjectName for compatibility with both interfaces
    const subjectToAdd: SubjectData = {
      ...currentSubject,
      name: currentSubject.subjectName
    };
    
    setSubjects([...subjects, subjectToAdd]);
    setCurrentSubject({
      ...currentSubject,
      name: '',
      subjectName: '',
      lecturerName: ''
    });
    setFormError(null);
  };

  const handleSubmit = () => {
    if (subjects.length === 0) {
      setFormError('Add at least one subject before proceeding');
      return;
    }
    
    // Double check all subjects have required fields
    const invalidSubjects = subjects.filter(
      subject => !subject.name || !subject.lecturerName || !subject.semester
    );
    
    if (invalidSubjects.length > 0) {
      setFormError('Some subjects have missing information');
      return;
    }
    
    onCreateSubjectFolders(subjects);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Create Subject Folders</h2>
        <button onClick={onBack} className="text-gray-500 hover:text-gray-700">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-center">
        <h3 className="text-lg font-medium text-gray-800">
          {selectedSemester ? `Create Subject Folders for Semester ${selectedSemester}` : 'Create Subject Folders'}
        </h3>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={currentSubject.subjectName}
              onChange={(e) => setCurrentSubject({...currentSubject, subjectName: e.target.value, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g. Data Structures"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lecturer Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={currentSubject.lecturerName}
              onChange={(e) => setCurrentSubject({...currentSubject, lecturerName: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g. John Doe"
              required
            />
          </div>
        </div>
        
        {formError && (
          <div className="mb-4 p-2 bg-red-50 text-red-600 text-sm rounded border border-red-200">
            {formError}
          </div>
        )}
        
        <button
          onClick={handleAddSubject}
          className="flex items-center px-3 py-2 text-indigo-600 border border-indigo-200 rounded-md hover:bg-indigo-50"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Subject
        </button>
      </div>
      
      {subjects.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Subjects to be created:</h4>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lecturer</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subjects.map((subject, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{subject.subjectName || subject.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{subject.lecturerName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Display existing subjects for this semester if requested */}
      {showAvailableSubjects && selectedSemester && existingSubjectsForSemester.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Existing subjects for Semester {selectedSemester}:</h4>
          <div className="border border-gray-200 rounded-lg p-4">
            {existingSubjectsForSemester.map((subject, index) => (
              <div key={index} className="mb-2 pb-2 border-b border-gray-100 last:border-0 last:mb-0 last:pb-0">
                <p className="font-medium">{subject.name || subject.subjectName}</p>
                <p className="text-sm text-gray-600">Lecturer: {subject.lecturerName}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {showAvailableSubjects && selectedSemester && existingSubjectsForSemester.length === 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Existing subjects for Semester {selectedSemester}:</h4>
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-500">No existing subjects for this semester.</p>
          </div>
        </div>
      )}
      
      <div className="flex justify-between pt-4 border-t">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Back
        </button>
        
        <div className="flex space-x-3">
          <button
            onClick={onSkipToUpload}
            className="px-4 py-2 text-indigo-600 border border-indigo-200 rounded-md hover:bg-indigo-50"
          >
            Skip to Upload
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={subjects.length === 0}
            className={`px-4 py-2 rounded-md text-white ${
              subjects.length === 0 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            Create Subject Folders
          </button>
        </div>
      </div>
    </div>
  );
};
