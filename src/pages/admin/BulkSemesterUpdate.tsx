
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../services/api.ts';
import { Search, RefreshCw } from 'lucide-react';

interface Student {
  _id: string;
  fullName: string;
  email: string;
  department: string;
  semester: number;
  usn: string;
}

const BulkSemesterUpdate = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [currentSemester, setCurrentSemester] = useState<number>(0);
  const [newSemester, setNewSemester] = useState<number>(0);
  const [departments, setDepartments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await api.get('/api/user/stats/departments');
        if (response.data && response.data.departments) {
          setDepartments(response.data.departments);
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
        toast.error('Failed to load departments');
        // Fallback to common departments
        setDepartments(['CSE', 'ECE', 'EEE', 'ME', 'CE', 'ISE']);
      }
    };

    fetchDepartments();
  }, []);

  const fetchStudents = async () => {
    if (!selectedDepartment || !currentSemester) {
      toast.error('Please select both department and current semester');
      return;
    }

    setIsLoading(true);
    try {
      // Updated API call to filter by semester and department
      const response = await api.get(`/api/admin/users?role=student&department=${selectedDepartment}&semester=${currentSemester}`);
      
      if (response.data && response.data.users) {
        // Filter out users that don't match the semester
        const filteredUsers = response.data.users.filter(
          (user: Student) => user.semester === currentSemester
        );
        
        setStudents(filteredUsers);
        setSelectedStudents([]);  // Reset selected students
        
        if (filteredUsers.length === 0) {
          toast.info('No students found for the selected criteria');
        }
      } else {
        setStudents([]);
        toast.error('No students found for the selected criteria');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load student data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);  // Deselect all
    } else {
      setSelectedStudents(students.map(student => student._id));  // Select all
    }
  };

  const handleSelectStudent = (studentId: string) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  const handleSubmit = async () => {
    if (selectedStudents.length === 0) {
      toast.error('Please select at least one student');
      return;
    }

    if (!newSemester || newSemester < 1 || newSemester > 8) {
      toast.error('Please enter a valid semester (1-8)');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/api/admin/users/bulk-update', {
        userIds: selectedStudents,
        updates: { semester: newSemester }
      });

      if (response.data && response.data.success) {
        toast.success(`Updated semester for ${selectedStudents.length} students`);
        // Refresh student list
        fetchStudents();
      }
    } catch (error) {
      console.error('Error updating semesters:', error);
      toast.error('Failed to update semesters');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Filter students based on search term
  const filteredStudents = students.filter(student => 
    student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.usn && student.usn.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 md:p-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Bulk Semester Update</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Semester</label>
            <select
              value={currentSemester}
              onChange={(e) => setCurrentSemester(parseInt(e.target.value))}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="0">Select Semester</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option key={sem} value={sem}>{sem}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Semester</label>
            <select
              value={newSemester}
              onChange={(e) => setNewSemester(parseInt(e.target.value))}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="0">Select Semester</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option key={sem} value={sem}>{sem}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={fetchStudents}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors flex justify-center items-center"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Find Students
                </>
              )}
            </button>
          </div>
        </div>
        
        {students.length > 0 && (
          <div className="mt-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 space-y-4 md:space-y-0">
              <div>
                <h2 className="text-lg font-semibold">Students ({students.length})</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedDepartment} - Semester {currentSemester}
                </p>
              </div>
              
              <div className="w-full md:w-auto flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4">
                <div className="relative w-full md:w-64">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, email, USN..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
                
                <label className="flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={selectedStudents.length === students.length && students.length > 0}
                    onChange={handleSelectAll}
                    className="rounded text-indigo-600 focus:ring-indigo-500 mr-2"
                  />
                  <span className="text-sm">Select All</span>
                </label>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
              {filteredStudents.length > 0 ? (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredStudents.map((student) => (
                    <li key={student._id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student._id)}
                          onChange={() => handleSelectStudent(student._id)}
                          className="mr-4 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">{student.fullName}</h3>
                          <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                            <div className="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400">
                              <span>{student.email}</span>
                            </div>
                            <div className="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400">
                              <span>USN: {student.usn || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-200">
                          Semester: {student.semester}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'No matching students found' : 'No students found'}
                </div>
              )}
            </div>
            
            <div className="mt-6 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedStudents.length} students selected
              </p>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || selectedStudents.length === 0 || newSemester === 0}
                className={`px-6 py-2 rounded-md flex items-center justify-center ${
                  isSubmitting || selectedStudents.length === 0 || newSemester === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                } transition-colors`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  `Update ${selectedStudents.length} Student${selectedStudents.length !== 1 ? 's' : ''} to Semester ${newSemester}`
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkSemesterUpdate;
