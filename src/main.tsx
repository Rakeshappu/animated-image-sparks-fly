
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';
import { Toaster } from 'react-hot-toast';

// Create a client with proper configuration and improved error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      // Using meta for error handling instead of onError
      meta: {
        onError: (error: any) => {
          console.error('Query error:', error);
        },
      },
    },
    mutations: {
      retry: 1,
      // Using meta for error handling instead of onError
      meta: {
        onError: (error: any) => {
          console.error('Mutation error:', error);
        },
      },
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster position="top-right" />
    </QueryClientProvider>
  </StrictMode>
);
