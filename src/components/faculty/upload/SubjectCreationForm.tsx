
import { useState, useEffect } from 'react';
import { SubjectData, SubjectFolder } from '../../../types/faculty';
import { PlusCircle } from 'lucide-react';

interface SubjectCreationFormProps {
  selectedSemester: number | null;
  onBack: () => void;
  onSkipToUpload: () => void;
  onCreateSubjectFolders: (subjects: SubjectData[]) => void;
  existingSubjectsForSemester?: SubjectFolder[];
  showAvailableSubjects?: boolean;
}

export const SubjectCreationForm = ({
  selectedSemester,
  onBack,
  onSkipToUpload,
  onCreateSubjectFolders,
  existingSubjectsForSemester = [],
  showAvailableSubjects = false
}: SubjectCreationFormProps) => {
  const [subjectInputs, setSubjectInputs] = useState<SubjectData[]>([
    { name: '', code: '', credits: 4 },
  ]);

  // Save semester selection to localStorage when it changes
  useEffect(() => {
    if (selectedSemester) {
      localStorage.setItem('selectedSemester', selectedSemester.toString());
    }
  }, [selectedSemester]);

  const addSubjectInput = () => {
    setSubjectInputs([...subjectInputs, { name: '', code: '', credits: 4 }]);
  };

  const updateSubjectInput = (index: number, field: keyof SubjectData, value: string | number) => {
    const updatedInputs = [...subjectInputs];
    updatedInputs[index] = { ...updatedInputs[index], [field]: value };
    setSubjectInputs(updatedInputs);
  };

  const removeSubjectInput = (index: number) => {
    if (subjectInputs.length > 1) {
      const updatedInputs = [...subjectInputs];
      updatedInputs.splice(index, 1);
      setSubjectInputs(updatedInputs);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out any empty subjects
    const validSubjects = subjectInputs.filter(subject => subject.name.trim() !== '');
    
    if (validSubjects.length === 0) {
      // If no valid subjects, just skip to upload
      onSkipToUpload();
      return;
    }
    
    // Add semester to each subject
    const subjectsWithSemester = validSubjects.map(subject => ({
      ...subject,
      semester: selectedSemester || 1
    }));
    
    onCreateSubjectFolders(subjectsWithSemester);
  };

  return (
    <div className="space-y-6">
      <div>
        <button onClick={onBack} className="text-indigo-600 hover:text-indigo-800 mb-4 inline-flex items-center">
          ← Back
        </button>
        <h2 className="text-xl font-semibold mb-1">
          {selectedSemester ? `Create Subject Folders for Semester ${selectedSemester}` : 'Create Subject Folders'}
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Add subjects to create organized folders for your learning materials
        </p>
      </div>
      
      {existingSubjectsForSemester.length > 0 && showAvailableSubjects && (
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <h3 className="font-medium mb-2">Existing Subjects</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {existingSubjectsForSemester.map((subject, idx) => (
              <div key={idx} className="bg-white p-2 rounded border text-sm">
                {subject.name}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          {subjectInputs.map((subject, index) => (
            <div key={index} className="grid grid-cols-12 gap-2">
              <div className="col-span-5">
                <input
                  type="text"
                  placeholder="Subject Name"
                  value={subject.name}
                  onChange={(e) => updateSubjectInput(index, 'name', e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="col-span-3">
                <input
                  type="text"
                  placeholder="Code"
                  value={subject.code}
                  onChange={(e) => updateSubjectInput(index, 'code', e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="col-span-2">
                <select
                  value={subject.credits}
                  onChange={(e) => updateSubjectInput(index, 'credits', parseInt(e.target.value))}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                  <option value={5}>5</option>
                </select>
              </div>
              <div className="col-span-2">
                <button
                  type="button"
                  onClick={() => removeSubjectInput(index)}
                  className="p-2 text-red-500 hover:text-red-700"
                  disabled={subjectInputs.length === 1}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <button
          type="button"
          onClick={addSubjectInput}
          className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
        >
          <PlusCircle className="h-4 w-4 mr-1" />
          Add Another Subject
        </button>
        
        <div className="flex justify-between pt-4">
          <button
            type="button"
            onClick={onSkipToUpload}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Skip & Upload Directly
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Create Subject Folders
          </button>
        </div>
      </form>
    </div>
  );
};
