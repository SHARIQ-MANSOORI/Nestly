const { connectRedis, disconnectRedis, getRedisClient } = require('../../config/redis');
const cacheService = require('../../services/cacheService');

describe('Cache Service & Redis Manager Unit Tests', () => {
  beforeAll(() => {
    connectRedis();
  });

  afterAll(async () => {
    await disconnectRedis();
  });

  beforeEach(async () => {
    cacheService.resetMetrics();
    const client = getRedisClient();
    if (client && typeof client.flushall === 'function') {
      await client.flushall();
    }
  });

  test('should set and get JSON values safely in cache', async () => {
    const testKey = 'nestly:v1:test:hotel:101';
    const testData = { id: '101', name: 'Grand Palace', city: 'Delhi', price: 4500 };

    const setResult = await cacheService.set(testKey, testData, 60);
    expect(setResult).toBe(true);

    const cached = await cacheService.get(testKey);
    expect(cached).toEqual(testData);
  });

  test('should return null for non-existent cache keys', async () => {
    const result = await cacheService.get('nestly:v1:nonexistent:key');
    expect(result).toBeNull();
  });

  test('should check key existence correctly', async () => {
    const key = 'nestly:v1:test:exists';
    await cacheService.set(key, { active: true }, 60);

    const exists = await cacheService.exists(key);
    expect(exists).toBe(true);

    const notExists = await cacheService.exists('nestly:v1:test:missing');
    expect(notExists).toBe(false);
  });

  test('should delete cached key', async () => {
    const key = 'nestly:v1:test:delete';
    await cacheService.set(key, { data: 'sample' }, 60);

    const deleteResult = await cacheService.delete(key);
    expect(deleteResult).toBe(true);

    const check = await cacheService.get(key);
    expect(check).toBeNull();
  });

  test('should delete matching pattern keys with deleteMany', async () => {
    await cacheService.set('nestly:v1:search:hash1', [{ id: 1 }], 60);
    await cacheService.set('nestly:v1:search:hash2', [{ id: 2 }], 60);
    await cacheService.set('nestly:v1:hotel:101', { name: 'Hotel 1' }, 60);

    await cacheService.deleteMany('nestly:v1:search:*');

    expect(await cacheService.get('nestly:v1:search:hash1')).toBeNull();
    expect(await cacheService.get('nestly:v1:search:hash2')).toBeNull();
    expect(await cacheService.get('nestly:v1:hotel:101')).not.toBeNull();
  });

  test('should handle cache-aside getOrSet (Cache Hit vs Cache Miss)', async () => {
    const key = 'nestly:v1:test:getorset';
    let fetchCount = 0;

    const fetchFunction = async () => {
      fetchCount++;
      return { id: 1, title: 'Fetched from DB' };
    };

    // 1st Call: Cache Miss -> Calls fetchFunction
    const res1 = await cacheService.getOrSet(key, 60, fetchFunction);
    expect(res1).toEqual({ id: 1, title: 'Fetched from DB' });
    expect(fetchCount).toBe(1);

    // 2nd Call: Cache Hit -> Returns cached data without calling fetchFunction
    const res2 = await cacheService.getOrSet(key, 60, fetchFunction);
    expect(res2).toEqual({ id: 1, title: 'Fetched from DB' });
    expect(fetchCount).toBe(1);

    const metrics = cacheService.getMetrics();
    expect(metrics.hits).toBe(1);
    expect(metrics.misses).toBe(1);
    expect(metrics.hitRatio).toBe(50);
  });

  test('should generate consistent hashed search keys regardless of query param order', () => {
    const q1 = { city: 'Delhi', minPrice: '1000', maxPrice: '5000' };
    const q2 = { maxPrice: '5000', city: 'Delhi', minPrice: '1000' };

    const key1 = cacheService.generateKey.search(q1);
    const key2 = cacheService.generateKey.search(q2);

    expect(key1).toEqual(key2);
  });

  test('should trigger invalidations correctly for hotel, room, and review helpers', async () => {
    await cacheService.set(cacheService.generateKey.hotel('h1'), { name: 'Hotel 1' }, 60);
    await cacheService.set(cacheService.generateKey.hotelRooms('h1'), [{ id: 'r1' }], 60);
    await cacheService.set(cacheService.generateKey.reviews('h1', 1, 10, 'recent'), [{ id: 'rev1' }], 60);
    await cacheService.set('nestly:v1:search:123', [{ id: 'h1' }], 60);

    await cacheService.invalidateReviewCache('h1');

    expect(await cacheService.get(cacheService.generateKey.reviews('h1', 1, 10, 'recent'))).toBeNull();
    expect(await cacheService.get(cacheService.generateKey.hotel('h1'))).toBeNull();
    expect(await cacheService.get('nestly:v1:search:123')).toBeNull();
  });
});
