const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../../app');
const Hotel = require('../../models/Hotel');
const Room = require('../../models/Room');
const User = require('../../models/User');
const Booking = require('../../models/Booking');
const { connectRedis, disconnectRedis, getRedisClient, resetRedisClient } = require('../../config/redis');
const cacheService = require('../../services/cacheService');

const { generateToken } = require('../../utils/generateToken');
const cookieName = process.env.COOKIE_NAME || 'nestly_token';
let managerCookie;
let customerCookie;

let mongoServer;
let managerToken;
let customerToken;
let managerUser;
let customerUser;
let testHotel;
let testRoom;

describe('Phase 11 — Redis, Caching & Performance Integration Tests', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    connectRedis();

    // Create Manager User
    managerUser = await User.create({
      name: 'Cache Manager Owner',
      email: `cache.manager.${Date.now()}@example.com`,
      password: 'Password123!',
      role: 'manager',
    });

    // Create Customer User
    customerUser = await User.create({
      name: 'Cache Customer User',
      email: `cache.customer.${Date.now()}@example.com`,
      password: 'Password123!',
      role: 'customer',
    });

    // Generate tokens & cookies
    managerToken = generateToken(managerUser._id, 'manager');
    customerToken = generateToken(customerUser._id, 'customer');
    managerCookie = `${cookieName}=${managerToken}`;
    customerCookie = `${cookieName}=${customerToken}`;

    // Create Hotel directly in Mongo
    testHotel = await Hotel.create({
      name: 'The Redis Grand Resort',
      description: 'Luxury hotel for performance testing',
      location: 'Connaught Place',
      city: 'Delhi',
      country: 'India',
      addressDetails: { address: 'Connaught Place', city: 'Delhi', country: 'India' },
      images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945'],
      owner: managerUser._id,
      startingPrice: 5000,
      status: 'active',
      rating: 4.8,
      reviewCount: 0,
    });

    // Create Room directly in Mongo
    testRoom = await Room.create({
      hotel: testHotel._id,
      name: 'Presidential Suite',
      description: 'Spacious suite with high-speed WiFi',
      type: 'Presidential Suite',
      pricePerNight: 5000,
      capacity: 2,
      totalRooms: 5,
      status: 'available',
    });
  });

  afterAll(async () => {
    await disconnectRedis();
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    cacheService.resetMetrics();
    const client = getRedisClient();
    if (client && typeof client.flushall === 'function') {
      await client.flushall();
    }
  });

  test('1. Health Check endpoint reports status and service health', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.services.database).toBe('healthy');
    expect(res.body.services.redis).toBe('healthy');
    expect(res.body.metrics).toBeDefined();
  });

  test('2. Hotel Details Caching & Hit/Miss Lifecycle', async () => {
    const cacheKey = cacheService.generateKey.hotel(testHotel._id);

    // Initial Request -> Cache Miss -> Populates Cache
    const res1 = await request(app).get(`/api/hotels/${testHotel._id}`);
    expect(res1.statusCode).toBe(200);
    expect(res1.body.data.name).toBe('The Redis Grand Resort');

    const cachedVal = await cacheService.get(cacheKey);
    expect(cachedVal).not.toBeNull();
    expect(cachedVal.name).toBe('The Redis Grand Resort');

    // Second Request -> Cache Hit
    const res2 = await request(app).get(`/api/hotels/${testHotel._id}`);
    expect(res2.statusCode).toBe(200);
    expect(res2.body.data.name).toBe('The Redis Grand Resort');

    const metrics = cacheService.getMetrics();
    expect(metrics.hits).toBeGreaterThanOrEqual(1);
  });

  test('3. Search Caching with Query Normalization', async () => {
    // Search Request 1
    const res1 = await request(app).get('/api/hotels?city=Delhi&minPrice=2000&maxPrice=10000');
    expect(res1.statusCode).toBe(200);
    expect(res1.body.data.length).toBeGreaterThan(0);

    // Search Request 2 with swapped param order (should hit same cache)
    const res2 = await request(app).get('/api/hotels?maxPrice=10000&city=Delhi&minPrice=2000');
    expect(res2.statusCode).toBe(200);

    const metrics = cacheService.getMetrics();
    expect(metrics.hits).toBe(1);
  });

  test('4. Critical Test: Hotel Update invalidates hotel cache and serves fresh data', async () => {
    // Step 1: GET Hotel (Populates cache)
    const res1 = await request(app).get(`/api/hotels/${testHotel._id}`);
    expect(res1.body.data.name).toBe('The Redis Grand Resort');

    // Step 2: Update Hotel Name
    const updateRes = await request(app)
      .put(`/api/hotels/${testHotel._id}`)
      .set('Cookie', managerCookie)
      .send({
        name: 'The Ultra Redis Grand Resort',
      });
    expect(updateRes.statusCode).toBe(200);

    // Step 3: Cache should be invalidated immediately
    const cacheKey = cacheService.generateKey.hotel(testHotel._id);
    const cachedVal = await cacheService.get(cacheKey);
    expect(cachedVal).toBeNull();

    // Step 4: GET Hotel again returns updated fresh data
    const res2 = await request(app).get(`/api/hotels/${testHotel._id}`);
    expect(res2.body.data.name).toBe('The Ultra Redis Grand Resort');
  });

  test('5. Review Caching & Automatic Invalidation on new review/response', async () => {
    // Create a completed booking to review
    const booking = await Booking.create({
      user: customerUser._id,
      hotel: testHotel._id,
      room: testRoom._id,
      checkIn: new Date(Date.now() - 5 * 86400000),
      checkOut: new Date(Date.now() - 2 * 86400000),
      numberOfNights: 3,
      roomsBooked: 1,
      guests: 2,
      pricePerNight: 5000,
      subtotal: 15000,
      taxes: 1800,
      totalAmount: 16800,
      pricing: { basePrice: 5000, nights: 3, roomSubtotal: 15000, taxesAndFees: 1800, totalAmount: 16800 },
      status: 'completed',
      paymentStatus: 'paid',
      bookingReference: `TEST-REF-${Date.now()}`,
    });

    // 1. Initial Review Fetch -> Cache Miss
    await request(app).get(`/api/reviews/hotels/${testHotel._id}/reviews`);

    // 2. Post Review -> Invalidates review cache
    const createRevRes = await request(app)
      .post('/api/reviews')
      .set('Cookie', customerCookie)
      .send({
        bookingId: booking._id,
        rating: 5,
        title: 'Outstanding Redis Speed!',
        comment: 'Very fast response times and amazing amenities.',
      });
    expect(createRevRes.statusCode).toBe(201);

    // 3. Fetch reviews again -> Returns fresh review
    const revRes = await request(app).get(`/api/reviews/hotels/${testHotel._id}/reviews`);
    expect(revRes.statusCode).toBe(200);
    expect(revRes.body.data.total).toBe(1);
    expect(revRes.body.data.reviews[0].title).toBe('Outstanding Redis Speed!');
  });

  test('6. Analytics Overview Caching and Manager Authorization Isolation', async () => {
    const res1 = await request(app)
      .get('/api/analytics/manager/overview?filter=30d')
      .set('Cookie', managerCookie);
    expect(res1.statusCode).toBe(200);

    const metrics1 = cacheService.getMetrics();

    // Repeat same manager query -> Cache hit
    const res2 = await request(app)
      .get('/api/analytics/manager/overview?filter=30d')
      .set('Cookie', managerCookie);
    expect(res2.statusCode).toBe(200);

    const metrics2 = cacheService.getMetrics();
    expect(metrics2.hits).toBe(metrics1.hits + 1);
  });

  test('7. Redis Failure Fallback & Graceful Degradation', async () => {
    // Simulate Redis client disconnect / error by swapping to offline state
    resetRedisClient(null); // Simulate Redis server completely offline

    // App should not crash! Health check reports 'degraded'
    const healthRes = await request(app).get('/health');
    expect(healthRes.statusCode).toBe(200);
    expect(healthRes.body.status).toBe('degraded');
    expect(healthRes.body.services.redis).toBe('unavailable');

    // Public hotel details endpoint falls back to MongoDB seamlessly
    const hotelRes = await request(app).get(`/api/hotels/${testHotel._id}`);
    expect(hotelRes.statusCode).toBe(200);
    expect(hotelRes.body.data).toBeDefined();

    // Restore Redis connection
    connectRedis();
  });

  test('8. Redis Restart Test: Cache disappears and repopulates without restarting app', async () => {
    // 1. Populate cache
    await request(app).get(`/api/hotels/${testHotel._id}`);
    const key = cacheService.generateKey.hotel(testHotel._id);
    expect(await cacheService.get(key)).not.toBeNull();

    // 2. Simulate Redis restart (Flush cache)
    const client = getRedisClient();
    if (client && typeof client.flushall === 'function') {
      await client.flushall();
    }
    expect(await cacheService.get(key)).toBeNull();

    // 3. App serves data from MongoDB and repopulates cache automatically
    const res = await request(app).get(`/api/hotels/${testHotel._id}`);
    expect(res.statusCode).toBe(200);
    expect(await cacheService.get(key)).not.toBeNull();
  });
});
