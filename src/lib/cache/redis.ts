
import { createClient, RedisClientType } from 'redis';
import { redisConfig } from '../config/services.ts';

let redisClient: RedisClientType | null = null;

/**
 * Initialize Redis client connection
 */
export const initRedisClient = async () => {
  if (redisClient) return redisClient;

  redisClient = createClient({
    url: `redis://${redisConfig.password ? `:${redisConfig.password}@` : ''}${redisConfig.host}:${redisConfig.port}`,
  });

  redisClient.on('error', (err) => {
    console.error('Redis error:', err);
  });

  redisClient.on('connect', () => {
    console.log('Connected to Redis');
  });

  await redisClient.connect();
  return redisClient;
};

/**
 * Get Redis client instance
 */
export const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
};

/**
 * Set cache with expiration
 */
export const setCache = async (key: string, value: any, expiryInSeconds: number = 3600) => {
  try {
    const client = await initRedisClient();
    await client.set(key, JSON.stringify(value), { EX: expiryInSeconds });
    return true;
  } catch (error) {
    console.error('Redis setCache error:', error);
    return false;
  }
};

/**
 * Get cached value
 */
export const getCache = async (key: string): Promise<any | null> => {
  try {
    const client = await initRedisClient();
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Redis getCache error:', error);
    return null;
  }
};

/**
 * Delete cache for a key
 */
export const deleteCache = async (key: string): Promise<boolean> => {
  try {
    const client = await initRedisClient();
    await client.del(key);
    return true;
  } catch (error) {
    console.error('Redis deleteCache error:', error);
    return false;
  }
};

/**
 * Delete cache by pattern (e.g., "user:*")
 */
export const deleteCacheByPattern = async (pattern: string): Promise<boolean> => {
  try {
    const client = await initRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
    return true;
  } catch (error) {
    console.error('Redis deleteCacheByPattern error:', error);
    return false;
  }
};

/**
 * Close Redis connection
 */
export const closeRedisConnection = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
};
