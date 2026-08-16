const Redis = require('ioredis');

let redisClient = null;
let isConnected = false;
let isMocked = false;

/**
 * Initialize Redis Connection
 * Reads REDIS_URL from process.env (Default: redis://localhost:6379)
 * Handles fallback gracefully if Redis is down/unreachable.
 */
const connectRedis = () => {
  if (redisClient) {
    return redisClient;
  }

  // Use ioredis-mock in test environment if configured or forced
  if (process.env.NODE_ENV === 'test' && process.env.USE_REAL_REDIS !== 'true') {
    try {
      const RedisMock = require('ioredis-mock');
      redisClient = new RedisMock();
      isConnected = true;
      isMocked = true;
      console.log('[Redis] Initialized in-memory mock client for test environment.');
      return redisClient;
    } catch (err) {
      console.warn('[Redis] Failed to load ioredis-mock, attempting standard client.', err.message);
    }
  }

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1, // Fail fast so Express handlers don't block
      retryStrategy(times) {
        if (times > 5) {
          if (isConnected) {
            console.warn('[Redis] Connection lost. Nestly operating in degraded mode (MongoDB fallback active).');
          }
          isConnected = false;
          return 5000; // Retry every 5s silently
        }
        return Math.min(times * 100, 3000);
      },
      enableOfflineQueue: false, // Don't queue commands when connection is down
      lazyConnect: false,
    });

    redisClient.on('connect', () => {
      isConnected = true;
      console.log(`[Redis] Connected to Redis server at ${redisUrl.replace(/:[^:@]+@/, ':***@')}`);
    });

    redisClient.on('ready', () => {
      isConnected = true;
    });

    redisClient.on('error', (err) => {
      if (isConnected) {
        console.warn(`[Redis Error] ${err.message}. Operations falling back to MongoDB.`);
      }
      isConnected = false;
    });

    redisClient.on('close', () => {
      isConnected = false;
    });

    redisClient.on('reconnecting', () => {
      // Connecting attempt
    });
  } catch (error) {
    console.warn(`[Redis Initialization Failed] ${error.message}. Operations falling back to MongoDB.`);
    redisClient = null;
    isConnected = false;
  }

  return redisClient;
};

/**
 * Get current Redis client instance
 */
const getRedisClient = () => {
  if (!redisClient) {
    return connectRedis();
  }
  return redisClient;
};

/**
 * Check if Redis is currently connected and healthy
 */
const isRedisConnected = () => {
  return isConnected && redisClient !== null && (redisClient.status === 'ready' || redisClient.status === 'connect' || isMocked);
};

/**
 * Disconnect Redis client cleanly
 */
const disconnectRedis = async () => {
  if (redisClient) {
    try {
      if (typeof redisClient.disconnect === 'function') {
        redisClient.disconnect();
      } else if (typeof redisClient.quit === 'function') {
        await redisClient.quit();
      }
    } catch (e) {
      // Ignore disconnect errors
    } finally {
      redisClient = null;
      isConnected = false;
      isMocked = false;
    }
  }
};

/**
 * For testing purposes: Force mock mode or reset client
 */
const resetRedisClient = (mockClient = null) => {
  redisClient = mockClient;
  isConnected = !!mockClient;
  isMocked = !!mockClient;
};

module.exports = {
  connectRedis,
  getRedisClient,
  isRedisConnected,
  disconnectRedis,
  resetRedisClient,
};
