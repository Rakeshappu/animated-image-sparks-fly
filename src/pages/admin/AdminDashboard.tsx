
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <p>Welcome {user?.fullName || 'Admin'}</p>
      
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-medium text-lg mb-2">User Management</h3>
            <p className="text-gray-600 mb-4">Manage users, permissions and roles</p>
            <a href="/admin/users" className="text-blue-600 hover:underline">
              Manage Users →
            </a>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-medium text-lg mb-2">Resource Management</h3>
            <p className="text-gray-600 mb-4">Manage all learning resources</p>
            <a href="/admin/resources" className="text-blue-600 hover:underline">
              Manage Resources →
            </a>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-medium text-lg mb-2">USN Management</h3>
            <p className="text-gray-600 mb-4">Manage eligible USNs for signup</p>
            <a href="/admin/eligible-usns" className="text-blue-600 hover:underline">
              Manage USNs →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
