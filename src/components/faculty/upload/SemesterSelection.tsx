
import { X } from 'lucide-react';

type SemesterNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

interface SemesterSelectionProps {
  onSemesterSelect: (semester: SemesterNumber) => void;
  onBack: () => void;
}

export const SemesterSelection = ({ onSemesterSelect, onBack }: SemesterSelectionProps) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Select Semester</h2>
        <button onClick={onBack} className="text-gray-500 hover:text-gray-700">
          <X className="h-5 w-5" />
        </button>
      </div>

      <p className="text-gray-600">Select a semester for your resources:</p>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
          <button
            key={sem}
            onClick={() => onSemesterSelect(sem as SemesterNumber)}
            className="py-3 px-4 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-colors text-center"
          >
            <span className="text-lg font-semibold text-gray-800">Semester {sem}</span>
          </button>
        ))}
      </div>
      
      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Back
        </button>
      </div>
    </div>
  );
};
