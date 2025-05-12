import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const TrashPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/trash');
      setItems(response.data.trash);
    } catch (error) {
      console.error('Error fetching trash:', error);
      toast.error('Failed to load trash. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await api.post('/api/admin/trash/restore', { id });
      toast.success('Item restored successfully!');
      fetchData();
    } catch (error) {
      console.error('Error restoring item:', error);
      toast.error('Failed to restore item. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/admin/trash/delete/${id}`);
      toast.success('Item permanently deleted!');
      fetchData();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item. Please try again.');
    }
  };

  const renderActions = (item: { _id: string; title: string }) => {
    return (
      <div className="flex space-x-2">
        <button
          onClick={() => handleRestore(item._id)}
          className="text-green-600 hover:text-green-800"
        >
          Restore
        </button>
        <button
          onClick={() => handleDelete(item._id)}
          className="text-red-600 hover:text-red-800"
        >
          Delete Permanently
        </button>
      </div>
    );
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Trash</h1>
      {loading ? (
        <p>Loading...</p>
      ) : items.length === 0 ? (
        <p>Trash is empty.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Title</th>
                <th className="py-2 px-4 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any) => (
                <tr key={item._id}>
                  <td className="py-2 px-4 border-b">{item.title}</td>
                  <td className="py-2 px-4 border-b">{renderActions(item)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TrashPage;
