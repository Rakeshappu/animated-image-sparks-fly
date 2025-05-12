
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth.ts';
import { Trash, FileText, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatDateSafely, addDaysSafely } from '../../utils/dateUtils.ts';

interface TrashedItem {
  id: string;
  name: string;
  type: string;
  size: string;
  deletedAt: string;
  originalPath: string;
  resourceId?: string;
}

const TrashPage = () => {
  const { user } = useAuth();
  const [trashedItems, setTrashedItems] = useState<TrashedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchTrashedItems();
  }, []);
  
  const fetchTrashedItems = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/resources/trash', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch trashed items: ${response.status}`);
      }

      const data = await response.json();
      console.log('Admin trashed items fetched:', data);
      
      // Filter to ensure we only get items with deletedAt value
      const validTrashedItems = Array.isArray(data.items) ? 
        data.items.filter(item => item.deletedAt && item.deletedAt !== null && item.deletedAt !== 'null') : 
        [];
        
      setTrashedItems(validTrashedItems);
    } catch (error) {
      console.error('Error fetching trashed items:', error);
      setError('Failed to fetch trashed items');
      setTrashedItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const restoreItem = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/resources/trash/${id}/restore`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to restore item');
      }

      await fetchTrashedItems(); // Refresh the list
      toast.success('Item restored successfully');
    } catch (error) {
      console.error('Error restoring item:', error);
      toast.error('Failed to restore item');
    }
  };

  const deleteItemPermanently = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/resources/trash/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete item permanently');
      }

      await fetchTrashedItems(); // Refresh the list
      toast.success('Item permanently deleted');
    } catch (error) {
      console.error('Error deleting item permanently:', error);
      toast.error('Failed to delete item permanently');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
          <Trash className="mr-2 text-red-500" size={24} />
          Admin Trash
        </h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-red-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex">
            <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      ) : trashedItems.length === 0 ? (
        <div className="text-center py-10">
          <Trash className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Trash is empty</h3>
          <p className="mt-1 text-sm text-gray-500">
            There are no items in the admin trash.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {trashedItems.map((item) => (
              <li key={item.id}>
                <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 truncate">
                        {item.name}
                      </p>
                      <p className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <span>{item.type}</span>
                        <span className="mx-1">•</span>
                        <span>{item.size}</span>
                        <span className="mx-1">•</span>
                        <span>Deleted on {formatDateSafely(item.deletedAt)}</span>
                      </p>
                      <p className="text-xs text-red-500">
                        Will be deleted permanently on {addDaysSafely(item.deletedAt, 30)}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => restoreItem(item.id)}
                      className="p-1 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                      title="Restore"
                    >
                      <RefreshCw size={18} />
                    </button>
                    <button 
                      onClick={() => deleteItemPermanently(item.id)}
                      className="p-1 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      title="Delete permanently"
                    >
                      <Trash size={18} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TrashPage;
