
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import api from '../services/api';

export interface DownloadedItem {
  id: string;
  name: string;
  type: string;
  size: string;
  date: string;
  fileUrl?: string;
}

export function useDownloads() {
  const [downloadedItems, setDownloadedItems] = useState<DownloadedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchDownloads = async () => {
      try {
        const response = await api.get(`/api/user/${user?._id}/downloads`);
        setDownloadedItems(response.data.downloads);
      } catch (error) {
        console.error('Error fetching downloads:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchDownloads();
    }
  }, [user]);

  return { downloadedItems, isLoading };
}
