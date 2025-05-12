
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User as UserIcon } from 'lucide-react';
import api from '../../services/api.ts';
import { toast } from 'react-hot-toast';

interface User {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  department: string;
  semester?: number;
  isEmailVerified: boolean;
  isAdminVerified: boolean;
  gender?: string;
  usn?: string;
  batch?: string;
  qualification?: string;
  designation?: string;
}

const EditUserPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    department: '',
    semester: '',
    role: '',
    gender: '',
    usn: '',
    batch: '',
    qualification: '',
    designation: '',
    isEmailVerified: false,
    isAdminVerified: false,
  });

  // Available departments
  const departments = ['CSE', 'ECE', 'EEE', 'ME', 'CE', 'ISE'];
  
  // Available roles
  const roles = ['student', 'faculty', 'admin'];

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) {
        toast.error('User ID is missing');
        navigate('/admin/users');
        return;
      }

      try {
        setIsLoading(true);
        const response = await api.get(`/api/admin/users/${userId}`);
        
        if (response.data && response.data.user) {
          const userData = response.data.user;
          setUser(userData);
          
          // Set form data
          setFormData({
            fullName: userData.fullName || '',
            email: userData.email || '',
            department: userData.department || '',
            semester: userData.semester?.toString() || '',
            role: userData.role || '',
            gender: userData.gender || '',
            usn: userData.usn || '',
            batch: userData.batch || '',
            qualification: userData.qualification || '',
            designation: userData.designation || '',
            isEmailVerified: userData.isEmailVerified || false,
            isAdminVerified: userData.isAdminVerified || false,
          });
        } else {
          toast.error('User not found');
          navigate('/admin/users');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        toast.error('Failed to load user data');
        navigate('/admin/users');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUser();
  }, [userId, navigate]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      toast.error('User ID is missing');
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Prepare data for API
      const updateData = {
        ...formData,
        semester: formData.semester ? parseInt(formData.semester) : undefined,
      };
      
      const response = await api.put(`/api/admin/users/${userId}`, updateData);
      
      if (response.data && response.data.success) {
        toast.success('User updated successfully');
        navigate('/admin/users');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/admin/users')}
          className="mr-4 text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Edit User</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
        {user ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
              <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <UserIcon className="h-10 w-10 text-gray-500 dark:text-gray-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{user.fullName}</h2>
                <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
                <div className="mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                    {user.role}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-white">Basic Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    >
                      <option value="">Select Role</option>
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Department</label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Role-specific Information */}
              <div>
                <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-white">Additional Information</h3>
                
                <div className="space-y-4">
                  {formData.role === 'student' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Semester</label>
                        <select
                          name="semester"
                          value={formData.semester}
                          onChange={handleChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                          <option value="">Select Semester</option>
                          {Array.from({ length: 8 }, (_, i) => i + 1).map((sem) => (
                            <option key={sem} value={sem}>
                              {sem}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">USN</label>
                        <input
                          type="text"
                          name="usn"
                          value={formData.usn}
                          onChange={handleChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Batch</label>
                        <input
                          type="text"
                          name="batch"
                          value={formData.batch}
                          onChange={handleChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                    </>
                  )}
                  
                  {formData.role === 'faculty' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Qualification</label>
                        <input
                          type="text"
                          name="qualification"
                          value={formData.qualification}
                          onChange={handleChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Designation</label>
                        <input
                          type="text"
                          name="designation"
                          value={formData.designation}
                          onChange={handleChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                    </>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div className="flex space-x-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isEmailVerified"
                        name="isEmailVerified"
                        checked={formData.isEmailVerified}
                        onChange={(e) => setFormData({...formData, isEmailVerified: e.target.checked})}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isEmailVerified" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        Email Verified
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isAdminVerified"
                        name="isAdminVerified"
                        checked={formData.isAdminVerified}
                        onChange={(e) => setFormData({...formData, isAdminVerified: e.target.checked})}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isAdminVerified" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        Admin Verified
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end pt-5 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => navigate('/admin/users')}
                className="mr-3 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <p className="text-center py-4 text-gray-500 dark:text-gray-400">User not found</p>
        )}
      </div>
    </div>
  );
};

export default EditUserPage;
