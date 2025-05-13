
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FacultyResource } from '../../types/faculty';
import { toast } from 'react-hot-toast';
import { formatDate } from '../../utils/dateUtils';

const AllResources: React.FC = () => {
  const [resources, setResources] = useState<FacultyResource[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  
  useEffect(() => {
    fetchResources();
    fetchDepartments();
  }, []);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/resources/all');
      if (Array.isArray(response.data)) {
        setResources(response.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast.error('Failed to load resources');
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/api/departments');
      if (Array.isArray(response.data)) {
        setDepartments(response.data.map((dept: any) => dept.name || ''));
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const getResourceTypeBadge = (type: string = 'document') => {
    switch (type) {
      case 'document':
        return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs">Document</span>;
      case 'video':
        return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-md text-xs">Video</span>;
      case 'link':
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs">Link</span>;
      case 'note':
        return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-md text-xs">Note</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-md text-xs">{type || 'Unknown'}</span>;
    }
  };

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDepartment(e.target.value);
  };

  // Filter resources based on department
  const filteredResources = selectedDepartment === 'all'
    ? resources
    : resources.filter(resource => resource.department === selectedDepartment);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">All Resources</h1>
        <div className="flex gap-2">
          <select 
            className="border rounded p-2"
            value={selectedDepartment}
            onChange={handleDepartmentChange}
          >
            <option value="all">All Departments</option>
            {departments.map((dept, index) => (
              <option key={index} value={dept}>{dept}</option>
            ))}
          </select>
          <button 
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            onClick={fetchResources}
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading resources...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-4 border-b text-left">Title</th>
                <th className="py-2 px-4 border-b text-left">Type</th>
                <th className="py-2 px-4 border-b text-left">Subject</th>
                <th className="py-2 px-4 border-b text-left">Description</th>
                <th className="py-2 px-4 border-b text-left">Uploaded By</th>
                <th className="py-2 px-4 border-b text-left">Date</th>
                <th className="py-2 px-4 border-b text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredResources.map((resource) => (
                <tr key={resource.id || resource._id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">{resource.title}</td>
                  <td className="py-2 px-4 border-b">
                    {getResourceTypeBadge(resource.type || 'document')}
                  </td>
                  <td className="py-2 px-4 border-b">{resource.subject || 'N/A'}</td>
                  <td className="py-2 px-4 border-b">{resource.description || 'No description'}</td>
                  <td className="py-2 px-4 border-b">{resource.uploaderId || 'Unknown'}</td>
                  <td className="py-2 px-4 border-b">
                    {resource.createdAt ? formatDate(resource.createdAt) : 'Unknown date'}
                  </td>
                  <td className="py-2 px-4 border-b">
                    <button 
                      className="text-blue-600 hover:text-blue-800 mr-2"
                      onClick={() => {
                        if (resource.fileUrl) {
                          window.open(resource.fileUrl, '_blank');
                        } else {
                          toast.error('No file URL available');
                        }
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredResources.length === 0 && (
            <p className="text-center py-4">No resources found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AllResources;
