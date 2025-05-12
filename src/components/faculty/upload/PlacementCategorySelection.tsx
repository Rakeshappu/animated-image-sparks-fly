import { ChevronLeft } from 'lucide-react';
import { placementCategories } from '../../../utils/placementCategoryUtils.ts';

interface PlacementCategorySelectionProps {
  onCategorySelect: (categoryId: string, categoryName: string) => void;
  onBack: () => void;
}

export const PlacementCategorySelection = ({ onCategorySelect, onBack }: PlacementCategorySelectionProps) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Select Placement Category</h2>
        <button
          onClick={onBack}
          className="text-indigo-600 hover:text-indigo-800 flex items-center text-sm"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </button>
      </div>

      <p className="text-gray-600 mb-4">
        Select a category for your placement resources. This helps students find relevant resources easily.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {placementCategories.map((category) => (
          <div
            key={category.id}
            onClick={() => onCategorySelect(category.id, category.name)}
            className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
          >
            <h3 className="font-medium text-indigo-600">{category.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{category.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
