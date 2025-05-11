
import React, { createContext, useContext, useState } from 'react';

interface CacheItem {
  value: any;
  expiry: number;
}

interface LocalMemoryCacheContextType {
  getItem: (key: string) => any;
  setItem: (key: string, value: any, ttlSeconds?: number) => void;
  removeItem: (key: string) => void;
  clearCache: () => void;
}

const LocalMemoryCacheContext = createContext<LocalMemoryCacheContextType | undefined>(undefined);

export const useLocalMemoryCache = (): LocalMemoryCacheContextType => {
  const context = useContext(LocalMemoryCacheContext);
  if (!context) {
    throw new Error('useLocalMemoryCache must be used within a LocalMemoryCacheProvider');
  }
  return context;
};

export const LocalMemoryCacheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cache, setCache] = useState<Record<string, CacheItem>>({});

  const getItem = (key: string): any => {
    const item = cache[key];
    if (!item) return null;

    const now = Date.now();
    if (item.expiry < now) {
      // Item has expired
      removeItem(key);
      return null;
    }

    return item.value;
  };

  const setItem = (key: string, value: any, ttlSeconds = 3600): void => {
    const now = Date.now();
    const expiry = now + (ttlSeconds * 1000);
    
    setCache(prevCache => ({
      ...prevCache,
      [key]: {
        value,
        expiry
      }
    }));
  };

  const removeItem = (key: string): void => {
    setCache(prevCache => {
      const newCache = { ...prevCache };
      delete newCache[key];
      return newCache;
    });
  };

  const clearCache = (): void => {
    setCache({});
  };

  return (
    <LocalMemoryCacheContext.Provider value={{ getItem, setItem, removeItem, clearCache }}>
      {children}
    </LocalMemoryCacheContext.Provider>
  );
};

export default LocalMemoryCacheContext;
