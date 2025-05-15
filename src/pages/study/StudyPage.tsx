
import React, { useEffect, useState } from 'react';
import StudyMaterialsPage from './StudyMaterialsPage';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

export const StudyPage = () => {
  const [loading, setLoading] = useState(false);
  
  // Pre-fetch subject folders and resources to ensure they're loaded
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Try to fetch subject folders and resources
        await Promise.all([
          api.get('/api/subject-folders').catch(err => {
            console.log('Subject folders fetch error (expected during deployment):', err.message);
          }),
          api.get('/api/resources').catch(err => {
            console.log('Resources fetch error (expected during deployment):', err.message);
          })
        ]);
      } catch (error) {
        console.error('Error in initial data fetch:', error);
        // Show error toast only during development
        if (process.env.NODE_ENV !== 'production') {
          toast.error('Some resources might not be available yet. This is expected during deployment.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  return <StudyMaterialsPage />;
};

export default StudyPage;