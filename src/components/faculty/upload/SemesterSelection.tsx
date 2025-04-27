
import { useState, useEffect } from 'react';

type SemesterNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

interface SemesterSelectionProps {
  onSemesterSelect: (semester: SemesterNumber) => void;
  onBack: () => void;
}

export const SemesterSelection = ({ onSemesterSelect, onBack }: SemesterSelectionProps) => {
  const [selectedSemester, setSelectedSemester] = useState<SemesterNumber | null>(null);
  
  // Load saved semester from localStorage on component mount
  useEffect(() => {
    const savedSemester = localStorage.getItem('selectedSemester');
    if (savedSemester) {
      const semester = parseInt(savedSemester) as SemesterNumber;
      if (semester >= 1 && semester <= 8) {
        setSelectedSemester(semester);
      }
    }
  }, []);
  
  const handleSelectSemester = (semester: SemesterNumber) => {
    setSelectedSemester(semester);
    // Save to localStorage
    localStorage.setItem('selectedSemester', semester.toString());
    onSemesterSelect(semester);
  };
  
  const semesters: SemesterNumber[] = [1, 2, 3, 4, 5, 6, 7, 8];
  
  return (
    <div className="space-y-6">
      <div>
        <button onClick={onBack} className="text-indigo-600 hover:text-indigo-800 mb-4 inline-flex items-center">
          ← Back
        </button>
        <h2 className="text-xl font-semibold mb-1">Select a Semester</h2>
        <p className="text-sm text-gray-500 mb-4">
          Choose the semester for which you want to upload resources
        </p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {semesters.map((semester) => (
          <button
            key={semester}
            onClick={() => handleSelectSemester(semester)}
            className={`p-6 rounded-lg border-2 ${
              selectedSemester === semester
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            } transition-colors duration-200 focus:outline-none`}
          >
            <p className={`text-xl font-bold ${
              selectedSemester === semester ? 'text-indigo-600' : 'text-gray-700'
            }`}>
              {semester}
            </p>
            <p className="text-sm text-gray-500">Semester</p>
          </button>
        ))}
      </div>
    </div>
  );
};
