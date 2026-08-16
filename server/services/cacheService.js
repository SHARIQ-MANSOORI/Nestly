const crypto = require('crypto');
const { getRedisClient, isRedisConnected } = require('../config/redis');

// In-memory metrics tracking
const metrics = {
  hits: 0,
  misses: 0,
  errors: 0,
  invalidations: 0,
};

/**
 * Normalize and hash query parameters to generate consistent search keys
 */
const hashQueryParams = (queryObj = {}) => {
  if (!queryObj || typeof queryObj !== 'object') {
    return 'default';
  }

  // Sort keys to ensure query order independence
  const sortedKeys = Object.keys(queryObj).sort();
  const normalizedParams = {};

  for (const key of sortedKeys) {
    const val = queryObj[key];
    if (val !== undefined && val !== null && val !== '') {
      normalizedParams[key] = String(val).trim().toLowerCase();
    }
  }

  const queryString = JSON.stringify(normalizedParams);
  return crypto.createHash('md5').update(queryString).digest('hex');
};

/**
 * Standardized Namespaced Key Generators
 */
const generateKey = {
  hotel: (hotelId) => `nestly:v1:hotel:${hotelId}`,
  hotelRooms: (hotelId) => `nestly:v1:hotel:${hotelId}:rooms`,
  room: (roomId) => `nestly:v1:room:${roomId}`,
  search: (queryParams) => `nestly:v1:search:${hashQueryParams(queryParams)}`,
  reviews: (hotelId, page = 1, limit = 10, sort = 'recent') =>
    `nestly:v1:hotel:${hotelId}:reviews:${page}:${limit}:${sort}`,
  analyticsManager: (managerId, filter = '30d', from = '', to = '') =>
    `nestly:v1:analytics:manager:${managerId}:${filter}:${from}:${to}`,
  analyticsAdmin: (filter = '30d', from = '', to = '') =>
    `nestly:v1:analytics:admin:${filter}:${from}:${to}`,
};

class CacheService {
  /**
   * Safe JSON Get from Redis
   */
  async get(key) {
    if (!isRedisConnected()) {
      return null;
    }

    try {
      const client = getRedisClient();
      if (!client) return null;

      const rawData = await client.get(key);
      if (!rawData) {
        return null;
      }

      return JSON.parse(rawData);
    } catch (error) {
      metrics.errors++;
      console.warn(`[CacheService GET Error] Key '${key}': ${error.message}`);
      return null;
    }
  }

  /**
   * Safe JSON Set in Redis with TTL in seconds
   */
  async set(key, value, ttlSeconds = 300) {
    if (!isRedisConnected()) {
      return false;
    }

    try {
      const client = getRedisClient();
      if (!client) return false;

      const serialized = JSON.stringify(value);
      if (ttlSeconds && ttlSeconds > 0) {
        await client.set(key, serialized, 'EX', ttlSeconds);
      } else {
        await client.set(key, serialized);
      }

      return true;
    } catch (error) {
      metrics.errors++;
      console.warn(`[CacheService SET Error] Key '${key}': ${error.message}`);
      return false;
    }
  }

  /**
   * Delete a single key
   */
  async delete(key) {
    if (!isRedisConnected()) {
      return false;
    }

    try {
      const client = getRedisClient();
      if (!client) return false;

      const deletedCount = await client.del(key);
      if (deletedCount > 0) {
        metrics.invalidations++;
      }
      return true;
    } catch (error) {
      metrics.errors++;
      console.warn(`[CacheService DELETE Error] Key '${key}': ${error.message}`);
      return false;
    }
  }

  /**
   * Delete keys matching a pattern using SCAN (safe for production, avoids FLUSHALL/KEYS)
   */
  async deleteMany(pattern) {
    if (!isRedisConnected()) {
      return false;
    }

    try {
      const client = getRedisClient();
      if (!client) return false;

      let cursor = '0';
      let totalDeleted = 0;

      // Handle both real Redis SCAN and ioredis-mock SCAN
      do {
        let reply;
        try {
          reply = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        } catch (scanErr) {
          // Fallback if client doesn't support SCAN
          break;
        }

        cursor = reply[0];
        const keys = reply[1];

        if (keys && keys.length > 0) {
          const count = await client.del(...keys);
          totalDeleted += count;
        }
      } while (cursor !== '0');

      if (totalDeleted > 0) {
        metrics.invalidations += totalDeleted;
      }

      return true;
    } catch (error) {
      metrics.errors++;
      console.warn(`[CacheService DELETEMANY Error] Pattern '${pattern}': ${error.message}`);
      return false;
    }
  }

  /**
   * Check if a key exists in Redis
   */
  async exists(key) {
    if (!isRedisConnected()) {
      return false;
    }

    try {
      const client = getRedisClient();
      if (!client) return false;

      const res = await client.exists(key);
      return res === 1;
    } catch (error) {
      metrics.errors++;
      return false;
    }
  }

  /**
   * Cache-Aside Pattern: Get from cache or compute and store
   */
  async getOrSet(key, ttlSeconds, fetchCallback) {
    // 1. Try fetching from Redis
    const cachedData = await this.get(key);

    if (cachedData !== null && cachedData !== undefined) {
      metrics.hits++;
      return cachedData;
    }

    // 2. Cache Miss (or Redis offline/error)
    metrics.misses++;
    const freshData = await fetchCallback();

    // 3. Populate Redis asynchronously if fresh data exists and Redis is connected
    if (freshData !== null && freshData !== undefined) {
      // Fire-and-forget set to avoid blocking API response
      this.set(key, freshData, ttlSeconds).catch(() => {});
    }

    return freshData;
  }

  /**
   * Invalidate hotel-related caches (hotel details, rooms, search results)
   */
  async invalidateHotelCache(hotelId) {
    await this.delete(generateKey.hotel(hotelId));
    await this.delete(generateKey.hotelRooms(hotelId));
    // Invalidate broad search cache entries
    await this.deleteMany('nestly:v1:search:*');
  }

  /**
   * Invalidate room-related caches
   */
  async invalidateRoomCache(roomId, hotelId) {
    if (roomId) {
      await this.delete(generateKey.room(roomId));
    }
    if (hotelId) {
      await this.delete(generateKey.hotel(hotelId));
      await this.delete(generateKey.hotelRooms(hotelId));
    }
    await this.deleteMany('nestly:v1:search:*');
  }

  /**
   * Invalidate review caches for a hotel
   */
  async invalidateReviewCache(hotelId) {
    await this.deleteMany(`nestly:v1:hotel:${hotelId}:reviews:*`);
    // Also invalidate hotel cache as hotel rating summary changes
    await this.delete(generateKey.hotel(hotelId));
    await this.deleteMany('nestly:v1:search:*');
  }

  /**
   * Invalidate analytics caches
   */
  async invalidateAnalyticsCache(managerId = null) {
    if (managerId) {
      await this.deleteMany(`nestly:v1:analytics:manager:${managerId}:*`);
    } else {
      await this.deleteMany('nestly:v1:analytics:manager:*');
    }
    await this.deleteMany('nestly:v1:analytics:admin:*');
  }

  /**
   * Retrieve current performance metrics
   */
  getMetrics() {
    const totalRequests = metrics.hits + metrics.misses;
    const hitRatio = totalRequests > 0 ? (metrics.hits / totalRequests) * 100 : 0;

    return {
      hits: metrics.hits,
      misses: metrics.misses,
      errors: metrics.errors,
      invalidations: metrics.invalidations,
      totalRequests,
      hitRatio: Number(hitRatio.toFixed(2)),
      connected: isRedisConnected(),
    };
  }

  /**
   * Reset metrics counters (useful for performance benchmark reset)
   */
  resetMetrics() {
    metrics.hits = 0;
    metrics.misses = 0;
    metrics.errors = 0;
    metrics.invalidations = 0;
  }
}

const cacheService = new CacheService();
cacheService.generateKey = generateKey;
cacheService.hashQueryParams = hashQueryParams;

module.exports = cacheService;
