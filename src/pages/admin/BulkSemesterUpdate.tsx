
import React, { useState } from 'react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const BulkSemesterUpdate = () => {
  const [subject, setSubject] = useState('');
  const [currentSemester, setCurrentSemester] = useState<number | ''>('');
  const [newSemester, setNewSemester] = useState<number | ''>('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject || currentSemester === '' || newSemester === '') {
      toast.error('Please fill in all fields.');
      return;
    }

    setIsUpdating(true);

    try {
      const response = await api.post('/api/admin/bulk-update-semester', {
        subject,
        currentSemester: Number(currentSemester),
        newSemester: Number(newSemester),
      });

      if (response.status === 200) {
        toast.success(response.data.message);
      } else {
        toast.error('Failed to update semesters.');
      }
    } catch (error: any) {
      console.error('Error updating semesters:', error);
      toast.error(error?.response?.data?.message || 'An unexpected error occurred.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Helper function to handle number input
  const handleSemesterChange = (
    setter: React.Dispatch<React.SetStateAction<number | ''>>
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setter('');
    } else {
      const numberValue = parseInt(value, 10);
      setter(isNaN(numberValue) ? '' : numberValue);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Bulk Semester Update</h1>
      <form onSubmit={handleSubmit} className="max-w-md mx-auto">
        <div className="mb-4">
          <label htmlFor="subject" className="block text-gray-700 text-sm font-bold mb-2">
            Subject:
          </label>
          <input
            type="text"
            id="subject"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter subject name"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="currentSemester" className="block text-gray-700 text-sm font-bold mb-2">
            Current Semester:
          </label>
          <input
            type="number"
            id="currentSemester"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={currentSemester}
            onChange={handleSemesterChange(setCurrentSemester)}
            placeholder="Enter current semester"
          />
        </div>
        <div className="mb-6">
          <label htmlFor="newSemester" className="block text-gray-700 text-sm font-bold mb-2">
            New Semester:
          </label>
          <input
            type="number"
            id="newSemester"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={newSemester}
            onChange={handleSemesterChange(setNewSemester)}
            placeholder="Enter new semester"
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            className={`bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
              isUpdating ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            type="submit"
            disabled={isUpdating}
          >
            {isUpdating ? 'Updating...' : 'Update Semesters'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BulkSemesterUpdate;
