
import React, { useState, useEffect } from 'react';
import api from '../../services/api.ts';
import { toast } from 'react-hot-toast';
import { UserPlus, Trash, FileSpreadsheet, Plus, Search, X, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.ts';

interface EligibleUSN {
  _id: string;
  usn: string;
  department: string;
  semester: number;
  isUsed: boolean;
  createdAt: string;
}

export const EligibleUSNs = () => {
  const { user } = useAuth();
  const [usns, setUSNs] = useState<EligibleUSN[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUSN, setNewUSN] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState({
    department: '',
    semester: '',
    status: ''
  });
  const [bulkUSNs, setBulkUSNs] = useState('');
  const [showBulkAdd, setShowBulkAdd] = useState(false);

  const departments = [
    'Computer Science',
    'Information Science',
    'Electronics & Communication',
    'Electrics',
    'Mechanical',
    'Civil'
  ];

  const loadUSNs = async () => {
    setLoading(true);
    try {
      console.log('Attempting to load eligible USNs with current user role:', user?.role);
      
      let url = '/api/admin/eligible-usns';
      const queryParams = [];
      
      if (filter.department) {
        queryParams.push(`department=${encodeURIComponent(filter.department)}`);
      }
      
      if (filter.semester) {
        queryParams.push(`semester=${filter.semester}`);
      }
      
      if (filter.status) {
        queryParams.push(`isUsed=${filter.status === 'used'}`);
      }
      
      if (queryParams.length > 0) {
        url += `?${queryParams.join('&')}`;
      }
      
      const response = await api.get(url);
      setUSNs(response.data.eligibleUSNs);
    } catch (error: any) {
      console.error('Failed to load eligible USNs:', error);
      toast.error('Failed to load eligible USNs');
      
      if (error.status === 403 && error.data?.message) {
        toast.error(error.data.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUSNs();
  }, [filter]);

  const handleAddUSN = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUSN.trim()) {
      toast.error('USN is required');
      return;
    }
    
    if (!department) {
      toast.error('Department is required');
      return;
    }
    
    if (!semester) {
      toast.error('Semester is required');
      return;
    }
    
    try {
      console.log('Attempting to add USN with admin role:', user?.role);
      
      const response = await api.post('/api/admin/eligible-usns', {
        usn: newUSN.trim().toUpperCase(),
        department,
        semester: parseInt(semester)
      });
      
      toast.success('USN added successfully');
      setNewUSN('');
      loadUSNs();
    } catch (error: any) {
      console.error('Failed to add USN:', error);
      toast.error(error.data?.error || error.message || 'Failed to add USN');
    }
  };

  const handleDeleteUSN = async (id: string) => {
    try {
      await api.delete(`/api/admin/eligible-usns/${id}`);
      toast.success('USN deleted successfully');
      loadUSNs();
    } catch (error: any) {
      toast.error('Failed to delete USN');
    }
  };

  const handleBulkAdd = async () => {
    if (!bulkUSNs.trim()) {
      toast.error('Please enter USNs');
      return;
    }
    
    if (!department) {
      toast.error('Department is required');
      return;
    }
    
    if (!semester) {
      toast.error('Semester is required');
      return;
    }
    
    const usnsArray = bulkUSNs
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    if (usnsArray.length === 0) {
      toast.error('No valid USNs found');
      return;
    }
    
    try {
      const response = await api.post('/api/admin/eligible-usns/bulk', {
        usns: usnsArray,
        department,
        semester: parseInt(semester)
      });
      
      toast.success(`Added ${response.data.results.added} out of ${response.data.results.total} USNs`);
      setBulkUSNs('');
      setShowBulkAdd(false);
      loadUSNs();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to bulk add USNs');
    }
  };

  const filteredUSNs = usns.filter(usn => {
    if (search) {
      return usn.usn.toLowerCase().includes(search.toLowerCase());
    }
    return true;
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Eligible USNs</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBulkAdd(!showBulkAdd)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md ${showBulkAdd ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-colors`}
          >
            {showBulkAdd ? (
              <>
                <X size={18} />
                Cancel Bulk Add
              </>
            ) : (
              <>
                <FileSpreadsheet size={18} />
                Bulk Add USNs
              </>
            )}
          </button>
        </div>
      </div>

      {showBulkAdd ? (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Bulk Add USNs</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enter USNs (one per line)
              </label>
              <textarea
                value={bulkUSNs}
                onChange={e => setBulkUSNs(e.target.value)}
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter USNs, one per line"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <select
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Semester
                </label>
                <select
                  value={semester}
                  onChange={e => setSemester(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Semester</option>
                  {Array.from({ length: 8 }, (_, i) => i + 1).map(sem => (
                    <option key={sem} value={sem}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <button
              onClick={handleBulkAdd}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors"
            >
              <Plus size={18} />
              Add USNs
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Add New USN</h2>
          <form onSubmit={handleAddUSN} className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                USN
              </label>
              <input
                type="text"
                value={newUSN}
                onChange={e => setNewUSN(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter USN"
              />
            </div>
            
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <select
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Semester
              </label>
              <select
                value={semester}
                onChange={e => setSemester(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Semester</option>
                {Array.from({ length: 8 }, (_, i) => i + 1).map(sem => (
                  <option key={sem} value={sem}>
                    Semester {sem}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors h-10"
              >
                <UserPlus size={18} />
                Add USN
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search USN
            </label>
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search by USN"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <select
              value={filter.department}
              onChange={e => setFilter({ ...filter, department: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Semester
            </label>
            <select
              value={filter.semester}
              onChange={e => setFilter({ ...filter, semester: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Semesters</option>
              {Array.from({ length: 8 }, (_, i) => i + 1).map(sem => (
                <option key={sem} value={sem}>
                  Semester {sem}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filter.status}
              onChange={e => setFilter({ ...filter, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="unused">Unused</option>
              <option value="used">Used</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredUSNs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    USN
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Semester
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUSNs.map(usn => (
                  <tr key={usn._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{usn.usn}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-900">{usn.department}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-900">Semester {usn.semester}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${usn.isUsed ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'}`}>
                        {usn.isUsed ? (
                          <>
                            <span className="mr-1">Used</span>
                            <Check size={14} />
                          </>
                        ) : 'Available'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500">
                        {new Date(usn.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleDeleteUSN(usn._id)}
                        className="text-red-600 hover:text-red-900"
                        disabled={usn.isUsed}
                        title={usn.isUsed ? "Can't delete used USN" : "Delete USN"}
                      >
                        <Trash size={18} className={usn.isUsed ? 'opacity-50 cursor-not-allowed' : ''} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 text-gray-500">
            No eligible USNs found
          </div>
        )}
      </div>
    </div>
  );
};

export default EligibleUSNs;
