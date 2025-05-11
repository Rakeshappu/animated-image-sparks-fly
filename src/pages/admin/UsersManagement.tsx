import { useState, useEffect } from 'react';
import { 
  User, Search, Trash2, CheckCircle, XCircle,
  Eye, Shield, Users as UsersIcon, Laptop, Mail, UserPlus
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

type UserRole = 'admin' | 'faculty' | 'student';

interface AppUser {
  _id: string;
  fullName: string;
  email: string;
  role: UserRole;
  department?: string;
  semester?: number;
  isEmailVerified: boolean;
  isAdminVerified: boolean;
  lastLogin?: string;
  createdAt?: string;
  avatar?: string;
}

const UsersManagement = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [semesterFilter, setSemesterFilter] = useState<number | 'all'>('all');
  const [availableDepartments, setAvailableDepartments] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [verifyingUser, setVerifyingUser] = useState<string | null>(null);
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  // Define transition variants for animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  // Fetch users data
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/api/admin/users');
        
        if (response.data && response.data.users) {
          setUsers(response.data.users);
          setFilteredUsers(response.data.users);
          
          // Extract unique departments
          const departments = Array.from(new Set(
            response.data.users
              .map((user: AppUser) => user.department)
              .filter(Boolean)
          )) as string[];
          
          setAvailableDepartments(departments);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUsers();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = users;
    
    // Apply search term filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }
    
    // Apply department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(user => user.department === departmentFilter);
    }
    
    // Apply semester filter
    if (semesterFilter !== 'all') {
      filtered = filtered.filter(user => user.semester === semesterFilter);
    }
    
    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter, departmentFilter, semesterFilter]);

  // Handle user actions
  const handleViewUser = (user: AppUser) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const handleEditUser = (userId: string) => {
    // Navigate to edit page with correct user ID
    navigate(`/admin/users/edit/${userId}`);
  };

  const handleVerifyUser = async (userId: string, verify: boolean) => {
    try {
      setVerifyingUser(userId);
      
      // Explicitly get token to ensure it's included
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication token missing. Please log in again.');
        return;
      }
      
      console.log('Verifying user with ID:', userId, 'Setting verified to:', verify);
      
      const response = await api.post('/api/admin/users/verify', 
        { userId, verify },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json' 
          } 
        }
      );
      
      console.log('Verify API response:', response.data);
      
      if (response.data && response.data.success) {
        // Update user in state
        setUsers(users.map(user => {
          if (user._id === userId) {
            return { ...user, isAdminVerified: verify };
          }
          return user;
        }));
        
        toast.success(verify ? 'User verified successfully' : 'User verification revoked');
      }
    } catch (error) {
      console.error('Error verifying user:', error);
      toast.error(verify ? 'Failed to verify user. You may need to refresh your admin session.' : 'Failed to revoke verification');
    } finally {
      setVerifyingUser(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      await api.delete('/api/admin/users', {
        data: { userId }
      });
      
      // Update local state
      setUsers(users.filter(user => user._id !== userId));
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleCreateUser = () => {
    navigate('/admin/users/create');
  };

  // Render role badge
  const RoleBadge = ({ role }: { role: UserRole }) => {
    const badgeColors = {
      admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      faculty: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      student: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    };
    
    const roleIcons = {
      admin: <Shield size={12} className="mr-1" />,
      faculty: <UsersIcon size={12} className="mr-1" />,
      student: <Laptop size={12} className="mr-1" />
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${badgeColors[role]}`}>
        {roleIcons[role]}
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    
    // Convert to proper date format
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div 
          className="flex items-center mb-6"
          variants={itemVariants}
        >
          <UsersIcon className="mr-2 text-indigo-500" size={24} />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">User Management</h1>
        </motion.div>

        {/* Filters and Search */}
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-5"
          variants={itemVariants}
        >
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="pl-10 pr-4 py-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Search users by name or email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="faculty">Faculty</option>
                <option value="student">Student</option>
              </select>
              <select
                className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                <option value="all">All Departments</option>
                {availableDepartments.map((dept, index) => (
                  <option key={index} value={dept}>{dept}</option>
                ))}
              </select>
              {roleFilter === 'student' && (
                <select
                  className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={semesterFilter}
                  onChange={(e) => setSemesterFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                >
                  <option value="all">All Semesters</option>
                  {Array.from({ length: 8 }, (_, i) => i + 1).map((sem) => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </select>
              )}
              <button
                className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
                onClick={handleCreateUser}
              >
                <UserPlus size={16} className="mr-1" />
                Add User
              </button>
            </div>
          </div>
        </motion.div>

        {/* Users Table */}
        <motion.div 
          className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg"
          variants={itemVariants}
        >
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No users found matching your criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Admin Approval</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Last Active</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {user.avatar ? (
                              <img 
                                className="h-10 w-10 rounded-full object-cover" 
                                src={user.avatar} 
                                alt={user.fullName} 
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                                <User 
                                  className="h-5 w-5 text-indigo-600 dark:text-indigo-300" 
                                  aria-hidden="true" 
                                />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{user.fullName}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                            {user.role === 'student' && user.semester && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">Sem {user.semester}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {user.department || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {user.isEmailVerified ? (
                            <>
                              <CheckCircle className="h-5 w-5 text-green-500" />
                              <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">Verified</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-5 w-5 text-red-500" />
                              <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">Not verified</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {user.isAdminVerified ? (
                            <>
                              <CheckCircle className="h-5 w-5 text-green-500" />
                              <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">Approved</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-5 w-5 text-red-500" />
                              <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">Not approved</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleViewUser(user)} 
                            className="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400"
                            title="View user details"
                          >
                            <Eye size={18} />
                          </button>
                          {currentUser?._id !== user._id && (
                            <button 
                              onClick={() => handleDeleteUser(user._id)} 
                              className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                              title="Delete user"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                          {currentUser?._id !== user._id && (
                            <button
                              onClick={() => handleVerifyUser(user._id, !user.isAdminVerified)}
                              disabled={verifyingUser === user._id}
                              className={`${
                                user.isAdminVerified
                                  ? "text-orange-500 hover:text-orange-700"
                                  : "text-green-600 hover:text-green-800"
                              } ${verifyingUser === user._id ? "opacity-50 cursor-not-allowed" : ""}`}
                              title={user.isAdminVerified ? "Revoke verification" : "Verify user"}
                            >
                              {user.isAdminVerified ? (
                                <XCircle size={18} />
                              ) : (
                                <CheckCircle size={18} />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
        
        {/* Stats Summary */}
        <motion.div 
          className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
          variants={itemVariants}
        >
          {[
            {
              title: 'Total Users',
              value: users.length,
              icon: <UsersIcon className="h-6 w-6 text-indigo-600" />
            },
            {
              title: 'Students',
              value: users.filter(u => u.role === 'student').length,
              icon: <Laptop className="h-6 w-6 text-green-600" />
            },
            {
              title: 'Faculty',
              value: users.filter(u => u.role === 'faculty').length,
              icon: <UsersIcon className="h-6 w-6 text-blue-600" />
            },
            {
              title: 'Admins',
              value: users.filter(u => u.role === 'admin').length,
              icon: <Shield className="h-6 w-6 text-purple-600" />
            }
          ].map((stat, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg"
            >
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 rounded-md p-3 bg-indigo-100 dark:bg-indigo-900">
                    {stat.icon}
                  </div>
                  <div className="ml-5">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {stat.title}
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
                      {stat.value}
                    </dd>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* User Details Modal */}
      {selectedUser && showDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">User Details</h3>
              <button 
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <XCircle size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center mb-6">
                {selectedUser.avatar ? (
                  <img 
                    src={selectedUser.avatar} 
                    alt={selectedUser.fullName}
                    className="w-20 h-20 rounded-full mr-4 object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mr-4">
                    <User className="h-10 w-10 text-indigo-600 dark:text-indigo-300" />
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedUser.fullName}</h2>
                  <RoleBadge role={selectedUser.role} />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    User ID: {selectedUser._id}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Contact Information</h4>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-gray-900 dark:text-white">{selectedUser.email}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Account Information</h4>
                  <div className="mt-2 space-y-2">
                    <p className="text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Department:</span>{' '}
                      <span className="text-gray-900 dark:text-white">{selectedUser.department || 'N/A'}</span>
                    </p>
                    {selectedUser.role === 'student' && selectedUser.semester && (
                      <p className="text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Semester:</span>{' '}
                        <span className="text-gray-900 dark:text-white">{selectedUser.semester}</span>
                      </p>
                    )}
                    <p className="text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Email Verified:</span>{' '}
                      <span className={`${selectedUser.isEmailVerified ? 'text-green-500' : 'text-red-500'}`}>
                        {selectedUser.isEmailVerified ? 'Yes' : 'No'}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Admin Approved:</span>{' '}
                      <span className={`${selectedUser.isAdminVerified ? 'text-green-500' : 'text-red-500'}`}>
                        {selectedUser.isAdminVerified ? 'Yes' : 'No'}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Created:</span>{' '}
                      <span className="text-gray-900 dark:text-white">{formatDate(selectedUser.createdAt)}</span>
                    </p>
                    <p className="text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Last active:</span>{' '}
                      <span className="text-gray-900 dark:text-white">{selectedUser.lastLogin ? formatDate(selectedUser.lastLogin) : 'Never'}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => {
                    handleVerifyUser(selectedUser._id, !selectedUser.isAdminVerified);
                    setSelectedUser({
                      ...selectedUser,
                      isAdminVerified: !selectedUser.isAdminVerified
                    });
                  }}
                  disabled={verifyingUser === selectedUser._id}
                  className={`px-4 py-2 rounded-md ${
                    selectedUser.isAdminVerified
                      ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                      : "bg-green-100 text-green-700 hover:bg-green-200"
                  } ${verifyingUser === selectedUser._id ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {selectedUser.isAdminVerified ? "Revoke Verification" : "Verify User"}
                </button>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;
