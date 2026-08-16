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
const { connectRedis, disconnectRedis } = require('../config/redis');
const cacheService = require('../services/cacheService');

let server;
let port;
let mongoServer;
let testHotelId;

const makeWorkerRequest = (path) => {
  return new Promise((resolve) => {
    const start = process.hrtime.bigint();
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method: 'GET',
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          const end = process.hrtime.bigint();
          const latencyMs = Number(end - start) / 1e6;
          resolve({ success: res.statusCode === 200, latencyMs });
        });
      }
    );
    req.on('error', () => {
      const end = process.hrtime.bigint();
      resolve({ success: false, latencyMs: Number(end - start) / 1e6 });
    });
    req.end();
  });
};

const runConcurrentLoadTest = async (concurrency = 25, totalRequests = 250) => {
  console.log(`\n========================================`);
  console.log(` Concurrent Load Test`);
  console.log(` Concurrency Workers: ${concurrency}`);
  console.log(` Total Requests: ${totalRequests}`);
  console.log(`========================================`);

  const paths = [
    '/api/hotels?city=Delhi',
    `/api/hotels/${testHotelId}`,
    `/api/reviews/hotels/${testHotelId}/reviews`,
  ];

  cacheService.resetMetrics();
  const startTime = process.hrtime.bigint();

  let completedRequests = 0;
  let successfulRequests = 0;
  const latencies = [];

  const runWorkerQueue = async () => {
    while (completedRequests < totalRequests) {
      completedRequests++;
      const path = paths[completedRequests % paths.length];
      const res = await makeWorkerRequest(path);
      if (res.success) successfulRequests++;
      latencies.push(res.latencyMs);
    }
  };

  const workers = [];
  for (let i = 0; i < concurrency; i++) {
    workers.push(runWorkerQueue());
  }

  await Promise.all(workers);

  const endTime = process.hrtime.bigint();
  const totalDurationSec = Number(endTime - startTime) / 1e9;
  const reqPerSec = Number((totalRequests / totalDurationSec).toFixed(2));

  latencies.sort((a, b) => a - b);
  const avgLatency = Number((latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2));
  const p50 = Number(latencies[Math.floor(latencies.length * 0.5)].toFixed(2));
  const p95 = Number(latencies[Math.floor(latencies.length * 0.95)].toFixed(2));

  const metrics = cacheService.getMetrics();

  console.log(`Duration:           ${totalDurationSec.toFixed(2)} seconds`);
  console.log(`Throughput:         ${reqPerSec} requests/sec`);
  console.log(`Success Rate:       ${((successfulRequests / totalRequests) * 100).toFixed(1)}%`);
  console.log(`Average Latency:    ${avgLatency} ms`);
  console.log(`p50 Latency:        ${p50} ms`);
  console.log(`p95 Latency:        ${p95} ms`);
  console.log(`Cache Hits:         ${metrics.hits}`);
  console.log(`Cache Hit Ratio:    ${metrics.hitRatio}%`);
  console.log(`========================================\n`);

  return { totalRequests, reqPerSec, avgLatency, p50, p95, cacheHitRatio: metrics.hitRatio };
};

const setupAndRunLoadTest = async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  connectRedis();

  const manager = await User.create({
    name: 'Load Test Manager',
    email: 'load.mgr@example.com',
    password: 'Password123!',
    role: 'manager',
  });

  const hotel = await Hotel.create({
    name: 'Load Test Hotel',
    description: 'High throughput test property',
    location: 'Airport Zone',
    city: 'Delhi',
    country: 'India',
    addressDetails: { address: 'Airport Zone', city: 'Delhi', country: 'India' },
    images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945'],
    owner: manager._id,
    startingPrice: 3500,
    status: 'active',
  });
  testHotelId = hotel._id;

  await Room.create({
    hotel: hotel._id,
    name: 'Standard Room',
    description: 'Standard guest room',
    type: 'Standard',
    pricePerNight: 3500,
    capacity: 2,
    totalRooms: 20,
    status: 'available',
  });

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  port = server.address().port;

  await runConcurrentLoadTest(25, 250);

  server.close();
  await disconnectRedis();
  await mongoose.disconnect();
  await mongoServer.stop();
};

if (require.main === module) {
  setupAndRunLoadTest().catch((err) => {
    console.error('Load test error:', err);
    process.exit(1);
  });
}

module.exports = { setupAndRunLoadTest, runConcurrentLoadTest };
