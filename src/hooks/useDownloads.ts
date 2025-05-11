
import { useState, useEffect, useCallback } from 'react';
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

  const fetchDownloads = useCallback(async () => {
    try {
      if (!user?._id) return;
      
      setIsLoading(true);
      const response = await api.get(`/api/user/${user._id}/downloads`);
      setDownloadedItems(response.data.downloads);
    } catch (error) {
      console.error('Error fetching downloads:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Function to refresh downloads
  const refreshDownloads = useCallback(() => {
    fetchDownloads();
  }, [fetchDownloads]);

  useEffect(() => {
    if (user) {
      fetchDownloads();
    }
  }, [user, fetchDownloads]);

  return { downloadedItems, isLoading, refreshDownloads };
}
