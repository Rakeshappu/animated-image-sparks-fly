import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the shape of the cache
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

interface Cache {
  [key: string]: CacheItem<any>;
}

interface LocalMemoryCacheContextType {
  get: <T>(key: string) => T | null;
  set: <T>(key: string, data: T, expiry?: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  has: (key: string) => boolean;
}

// Create context
const LocalMemoryCacheContext = createContext<LocalMemoryCacheContextType | null>(null);

// Default expiry time (30 minutes in milliseconds)
const DEFAULT_EXPIRY = 30 * 60 * 1000;

interface LocalMemoryCacheProviderProps {
  children: ReactNode;
}

export const LocalMemoryCacheProvider = ({ children }: LocalMemoryCacheProviderProps) => {
  const [cache, setCache] = useState<Cache>({});

  // Get data from cache
  const get = <T,>(key: string): T | null => {
    const item = cache[key];
    
    // If item doesn't exist or is expired, return null
    if (!item || (item.expiry > 0 && Date.now() > item.timestamp + item.expiry)) {
      remove(key);
      return null;
    }
    
    return item.data as T;
  };

  // Set data to cache
  const set = <T,>(key: string, data: T, expiry: number = DEFAULT_EXPIRY): void => {
    setCache(prevCache => ({
      ...prevCache,
      [key]: {
        data,
        timestamp: Date.now(),
        expiry
      }
    }));
  };

  // Remove item from cache
  const remove = (key: string): void => {
    setCache(prevCache => {
      const newCache = { ...prevCache };
      delete newCache[key];
      return newCache;
    });
  };

  // Clear entire cache
  const clear = (): void => {
    setCache({});
  };

  // Check if key exists in cache and is not expired
  const has = (key: string): boolean => {
    const item = cache[key];
    if (!item) return false;
    if (item.expiry > 0 && Date.now() > item.timestamp + item.expiry) {
      remove(key);
      return false;
    }
    return true;
  };

  // Clean expired items periodically (every minute)
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCache(prevCache => {
        const now = Date.now();
        const newCache = { ...prevCache };
        
        Object.entries(newCache).forEach(([key, item]) => {
          if (item.expiry > 0 && now > item.timestamp + item.expiry) {
            delete newCache[key];
          }
        });
        
        return newCache;
      });
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <LocalMemoryCacheContext.Provider
      value={{
        get,
        set,
        remove,
        clear,
        has
      }}
    >
      {children}
    </LocalMemoryCacheContext.Provider>
  );
};

// Hook to use cache
export const useLocalMemoryCache = () => {
  const context = useContext(LocalMemoryCacheContext);
  if (!context) {
    throw new Error('useLocalMemoryCache must be used within a LocalMemoryCacheProvider');
  }
  return context;
};

export default LocalMemoryCacheProvider;
