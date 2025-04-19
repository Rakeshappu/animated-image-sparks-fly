
/**
 * A simple in-memory cache implementation to use when Redis is not available
 */

type CacheItem = {
  value: any;
  expiry: number | null;
};

class LocalMemoryCache {
  private cache: Map<string, CacheItem> = new Map();
  
  // Store a value in the cache with optional expiration (in seconds)
  async set(key: string, value: any, expiryInSeconds?: number): Promise<void> {
    const expiry = expiryInSeconds ? Date.now() + (expiryInSeconds * 1000) : null;
    this.cache.set(key, { value, expiry });
    
    // Automatic cleanup for expired items
    if (expiry !== null && expiryInSeconds !== undefined) {
      setTimeout(() => {
        this.deleteIfExpired(key);
      }, expiryInSeconds * 1000);
    }
  }
  
  // Get a value from the cache
  async get(key: string): Promise<any> {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    // Check if the item has expired
    if (item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  // Delete a specific key
  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }
  
  // Delete all keys matching a pattern (simplified implementation)
  async deleteByPattern(pattern: string): Promise<void> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }
  
  // Check if a key has expired and delete it if it has
  private deleteIfExpired(key: string): void {
    const item = this.cache.get(key);
    if (item && item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key);
    }
  }
  
  // Clear the entire cache
  async clear(): Promise<void> {
    this.cache.clear();
  }
}

// Export a singleton instance
export const localMemoryCache = new LocalMemoryCache();
