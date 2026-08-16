process.env.NODE_ENV = process.env.NODE_ENV || 'test';

const http = require('http');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const Hotel = require('../models/Hotel');
const Room = require('../models/Room');
const User = require('../models/User');
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const { connectRedis, disconnectRedis, getRedisClient, resetRedisClient } = require('../config/redis');
const cacheService = require('../services/cacheService');
const { generateToken } = require('../utils/generateToken');

let server;
let port;
let mongoServer;
let managerToken;
let customerToken;
let testHotel;

// Utility to calculate percentiles
const calculateStats = (latencies, errors) => {
  if (latencies.length === 0) return { min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0, errorRate: 0 };
  const sorted = [...latencies].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const avg = Number((sum / sorted.length).toFixed(2));
  const min = Number(sorted[0].toFixed(2));
  const max = Number(sorted[sorted.length - 1].toFixed(2));
  const p50 = Number(sorted[Math.floor(sorted.length * 0.50)].toFixed(2));
  const p95 = Number(sorted[Math.floor(sorted.length * 0.95)].toFixed(2));
  const p99 = Number(sorted[Math.floor(sorted.length * 0.99)].toFixed(2));
  const errorRate = Number(((errors / (latencies.length + errors)) * 100).toFixed(2));

  return { min, max, avg, p50, p95, p99, errorRate };
};

// Simple HTTP request wrapper returning latency in ms
const makeRequest = (path, headers = {}) => {
  return new Promise((resolve) => {
    const start = process.hrtime.bigint();
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method: 'GET',
        headers,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          const end = process.hrtime.bigint();
          const latencyMs = Number(end - start) / 1e6;
          resolve({ statusCode: res.statusCode, latencyMs, success: res.statusCode >= 200 && res.statusCode < 400 });
        });
      }
    );

    req.on('error', () => {
      const end = process.hrtime.bigint();
      const latencyMs = Number(end - start) / 1e6;
      resolve({ statusCode: 500, latencyMs, success: false });
    });

    req.end();
  });
};

const runBenchmarkForEndpoint = async (name, path, headers, iterations = 100) => {
  console.log(`\n========================================`);
  console.log(` Benchmarking Endpoint: ${name}`);
  console.log(` Path: ${path} (${iterations} iterations)`);
  console.log(`========================================`);

  // --- Phase A: Redis OFF / Cache Bypass (Simulated Cold DB Access) ---
  const latenciesRedisOff = [];
  let errorsRedisOff = 0;

  for (let i = 0; i < iterations; i++) {
    // Clear cache before every request to simulate Redis OFF / Cold DB Miss
    await cacheService.deleteMany('nestly:v1:*');
    cacheService.resetMetrics();

    const result = await makeRequest(path, headers);
    if (result.success) {
      latenciesRedisOff.push(result.latencyMs);
    } else {
      errorsRedisOff++;
    }
  }

  const statsOff = calculateStats(latenciesRedisOff, errorsRedisOff);

  // --- Phase B: Redis ON / Hot Cache Hits ---
  const latenciesRedisOn = [];
  let errorsRedisOn = 0;

  // Warm up cache once
  await makeRequest(path, headers);
  cacheService.resetMetrics();

  for (let i = 0; i < iterations; i++) {
    const result = await makeRequest(path, headers);
    if (result.success) {
      latenciesRedisOn.push(result.latencyMs);
    } else {
      errorsRedisOn++;
    }
  }

  const statsOn = calculateStats(latenciesRedisOn, errorsRedisOn);
  const cacheMetrics = cacheService.getMetrics();

  const speedupP50 = (statsOff.p50 / Math.max(0.01, statsOn.p50)).toFixed(1);
  const speedupAvg = (statsOff.avg / Math.max(0.01, statsOn.avg)).toFixed(1);

  console.table([
    { Metric: 'Average (ms)', 'Redis OFF (MongoDB)': `${statsOff.avg} ms`, 'Redis ON (Cache)': `${statsOn.avg} ms`, Improvement: `${speedupAvg}x faster` },
    { Metric: 'p50 Median (ms)', 'Redis OFF (MongoDB)': `${statsOff.p50} ms`, 'Redis ON (Cache)': `${statsOn.p50} ms`, Improvement: `${speedupP50}x faster` },
    { Metric: 'p95 (ms)', 'Redis OFF (MongoDB)': `${statsOff.p95} ms`, 'Redis ON (Cache)': `${statsOn.p95} ms`, Improvement: '-' },
    { Metric: 'p99 (ms)', 'Redis OFF (MongoDB)': `${statsOff.p99} ms`, 'Redis ON (Cache)': `${statsOn.p99} ms`, Improvement: '-' },
    { Metric: 'Error Rate (%)', 'Redis OFF (MongoDB)': `${statsOff.errorRate}%`, 'Redis ON (Cache)': `${statsOn.errorRate}%`, Improvement: '-' },
    { Metric: 'Cache Hit Ratio (%)', 'Redis OFF (MongoDB)': '0%', 'Redis ON (Cache)': `${cacheMetrics.hitRatio}%`, Improvement: '-' },
  ]);

  return { name, path, statsOff, statsOn, speedupAvg, cacheMetrics };
};

const runFullBenchmark = async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  connectRedis();

  // Seed sample database
  const managerUser = await User.create({
    name: 'Benchmark Manager',
    email: 'bench.mgr@example.com',
    password: 'Password123!',
    role: 'manager',
  });

  const customerUser = await User.create({
    name: 'Benchmark Customer',
    email: 'bench.cust@example.com',
    password: 'Password123!',
    role: 'customer',
  });

  const cookieName = process.env.COOKIE_NAME || 'nestly_token';
  const mgrToken = generateToken(managerUser._id, 'manager');
  const custToken = generateToken(customerUser._id, 'customer');

  testHotel = await Hotel.create({
    name: 'Nestly Benchmark Hotel',
    description: 'High performance resort property',
    location: 'CP',
    city: 'Delhi',
    country: 'India',
    addressDetails: { address: 'CP', city: 'Delhi', country: 'India' },
    images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945'],
    owner: managerUser._id,
    startingPrice: 4000,
    status: 'active',
    rating: 4.9,
  });

  const testRoom = await Room.create({
    hotel: testHotel._id,
    name: 'Deluxe Suite',
    description: 'Spacious deluxe room',
    type: 'Deluxe',
    pricePerNight: 4000,
    capacity: 2,
    totalRooms: 10,
    status: 'available',
  });

  // Create sample review
  const booking = await Booking.create({
    user: customerUser._id,
    hotel: testHotel._id,
    room: testRoom._id,
    checkIn: new Date(Date.now() - 5 * 86400000),
    checkOut: new Date(Date.now() - 2 * 86400000),
    numberOfNights: 3,
    roomsBooked: 1,
    guests: 2,
    pricePerNight: 4000,
    subtotal: 12000,
    totalAmount: 14160,
    status: 'completed',
    paymentStatus: 'paid',
    bookingReference: 'NST-BENCH-101',
  });

  await Review.create({
    user: customerUser._id,
    booking: booking._id,
    hotel: testHotel._id,
    rating: 5,
    title: 'Superb Performance',
    comment: 'Blazing fast load times!',
    status: 'published',
  });

  // Start Express Server
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  port = server.address().port;
  console.log(`[Benchmark Server] Listening on 127.0.0.1:${port}`);

  const benchmarkResults = [];

  // Endpoint 1: GET /api/hotels
  benchmarkResults.push(await runBenchmarkForEndpoint('Hotel Search & Filter', '/api/hotels?city=Delhi&minPrice=1000', {}, 100));

  // Endpoint 2: GET /api/hotels/:id
  benchmarkResults.push(await runBenchmarkForEndpoint('Hotel Details Page', `/api/hotels/${testHotel._id}`, {}, 100));

  // Endpoint 3: GET /api/reviews/hotels/:id/reviews
  benchmarkResults.push(await runBenchmarkForEndpoint('Hotel Reviews List', `/api/reviews/hotels/${testHotel._id}/reviews`, {}, 100));

  // Endpoint 4: GET /api/analytics/manager/overview
  benchmarkResults.push(
    await runBenchmarkForEndpoint(
      'Manager Analytics Overview',
      '/api/analytics/manager/overview?filter=30d',
      { Cookie: `${cookieName}=${mgrToken}` },
      100
    )
  );

  console.log('\n========================================');
  console.log(' BENCHMARK SUMMARY (Redis ON vs Redis OFF)');
  console.log('========================================');
  benchmarkResults.forEach((b) => {
    console.log(
      `- ${b.name}: ${b.statsOff.p50}ms (p50 OFF) vs ${b.statsOn.p50}ms (p50 ON) -> ${b.speedupAvg}x speedup`
    );
  });

  // Cleanup
  server.close();
  await disconnectRedis();
  await mongoose.disconnect();
  await mongoServer.stop();
  console.log('\n[Benchmark Completed Successfully]\n');
};

if (require.main === module) {
  runFullBenchmark().catch((err) => {
    console.error('Benchmark error:', err);
    process.exit(1);
  });
}

module.exports = { runFullBenchmark, runBenchmarkForEndpoint };
