# Nestly Cache Architecture & Performance Layer (Phase 11)

This document provides a comprehensive guide to Nestly's caching strategy, Redis architecture, cache invalidation rules, failure fallbacks, and performance benchmarks.

---

## 1. Core Architectural Principle

> **"Redis makes Nestly faster; MongoDB keeps Nestly correct."**

MongoDB is Nestly's permanent source of truth. Redis serves as a high-speed temporary caching and rate-limiting layer. If Redis goes down or becomes unreachable, Nestly logs a warning and gracefully falls back to MongoDB without throwing errors or interrupting core user workflows.

```
                         NESTLY ARCHITECTURE
                            │
                       React Client
                            │
                            ↓
                     Node + Express
                            │
             ┌──────────────┼──────────────┐
             ↓              ↓              ↓
          Security        Redis         Services
                            │              │
                 ┌──────────┼───┐          ↓
                 ↓          ↓   ↓       MongoDB
               Hotel     Search Reviews    │
               Cache     Cache  Cache      │
                 │          │     │        │
                 └──────────┴─────┴────────┘
                            ↓
                         Response
```

---

## 2. Environment Configuration

To configure Redis, add the `REDIS_URL` variable to your `.env` file:

```env
# Redis Cache & Rate Limiting Connection
REDIS_URL=redis://localhost:6379
```

When `NODE_ENV=test` is active or if `USE_REDIS_MOCK=true` is set, Nestly automatically initializes an in-memory Redis client (`ioredis-mock`) to ensure all test suites pass reliably without needing a local Redis daemon running.

---

## 3. Cache-Aside Pattern Implementation

All read-heavy operations follow the **Cache-Aside Pattern**:

```
Request ──→ Redis GET ──┬── HIT ──→ Return Cached Response
                        │
                        └── MISS ──→ Query MongoDB ──→ Redis SET (with TTL) ──→ Return Response
```

Every controller or service interacts with `cacheService.getOrSet(key, ttlSeconds, fetchCallback)`, which safely encapsulates Redis connection management, JSON serialization/deserialization, error logging, and hit/miss metrics tracking.

---

## 4. Cache Key Namespace Strategy

All Redis keys are namespaced with versioning to avoid key collision across releases:

| Data Type | Cache Key Pattern | TTL (Seconds) | Description |
|---|---|---|---|
| **Hotel Details** | `nestly:v1:hotel:<hotelId>` | 600 (10 mins) | Public hotel details, owner info, and active room packages |
| **Hotel Rooms** | `nestly:v1:hotel:<hotelId>:rooms` | 300 (5 mins) | Active room list for a specific hotel property |
| **Room Details** | `nestly:v1:room:<roomId>` | 300 (5 mins) | Single room metadata, capacity, amenities, base price |
| **Hotel Search** | `nestly:v1:search:<hash>` | 180 (3 mins) | Normalized query hash (`city`, `minPrice`, `maxPrice`, `minRating`, `sort`) |
| **Hotel Reviews** | `nestly:v1:hotel:<hotelId>:reviews:<page>:<limit>:<sort>` | 300 (5 mins) | Paginated published guest reviews and ratings |
| **Manager Analytics** | `nestly:v1:analytics:manager:<managerId>:<filter>:<from>:<to>` | 300 (5 mins) | Manager financial & occupancy analytics overview |
| **Admin Analytics** | `nestly:v1:analytics:admin:<filter>:<from>:<to>` | 300 (5 mins) | Platform-wide admin revenue & growth analytics |
| **Rate Limits** | `nestly:rl:<auth|sensitive|public>:<ip>` | Window-based | Distributed rate limit state across multiple API servers |

---

## 5. What Is Cached vs What Is NEVER Cached

### ✅ What IS Cached
- Public hotel property details, photos, location, amenities, and starting prices
- Hotel search and filter result lists (query parameter hash)
- Published guest reviews, rating summaries, and manager responses
- Room metadata (type, description, capacity, amenities, base price per night)
- Manager and Admin analytics aggregation summaries

### ❌ What Is NEVER Cached
- Passwords and hashed credentials
- OTP plaintext codes
- JWT secrets and signing keys
- Payment secrets, API keys, and webhooks
- Booking confirmation state and booking creation requests
- **Authoritative Room Availability prior to reservation confirmation**: Search caching speeds up discovery browsing, but MongoDB is ALWAYS queried authoritatively with optimistic locks before confirming any reservation.

---

## 6. Cache Invalidation Matrix

When data is written or updated in MongoDB, the application invalidates the corresponding Redis cache entries:

| Trigger Event | Invalidation Actions |
|---|---|
| **Hotel Created** | Deletes `nestly:v1:search:*` |
| **Hotel Updated / Deactivated** | Deletes `nestly:v1:hotel:<id>`, `nestly:v1:hotel:<id>:rooms`, `nestly:v1:search:*` |
| **Room Created / Updated / Deactivated** | Deletes `nestly:v1:room:<id>`, `nestly:v1:hotel:<hotelId>`, `nestly:v1:hotel:<hotelId>:rooms`, `nestly:v1:search:*` |
| **Review Created / Updated / Moderated** | Deletes `nestly:v1:hotel:<hotelId>:reviews:*`, `nestly:v1:hotel:<hotelId>`, `nestly:v1:search:*` |
| **Booking / Payment Completed** | Deletes `nestly:v1:analytics:manager:<managerId>:*`, `nestly:v1:analytics:admin:*` |

---

## 7. Redis Failure Handling & Health Check

If Redis goes down or encounters network connectivity issues:
1. `cacheService` logs a warning without throwing an unhandled rejection.
2. The request falls back directly to MongoDB.
3. Nestly continues operating in **Degraded Mode**.
4. The `/health` endpoint updates the service health response:

```json
{
  "status": "degraded",
  "timestamp": "2026-08-16T21:30:00.000Z",
  "services": {
    "database": "healthy",
    "redis": "unavailable"
  },
  "metrics": {
    "hits": 142,
    "misses": 15,
    "errors": 1,
    "invalidations": 12,
    "totalRequests": 157,
    "hitRatio": 90.45,
    "connected": false
  }
}
```

---

## 8. Empirical Performance Benchmarks

Measured using Nestly's automated benchmark suite (`node scripts/benchmark.js`, 100 iterations per endpoint):

| Endpoint | MongoDB (Redis OFF) | Redis Cache (Redis ON) | Speedup / Improvement |
|---|---|---|---|
| **Hotel Search & Filter** | `8.72 ms` (p50) | `0.86 ms` (p50) | **10.1x faster** (8.3x avg) |
| **Hotel Details Page** | `9.23 ms` (p50) | `0.42 ms` (p50) | **22.0x faster** (18.9x avg) |
| **Hotel Reviews List** | `9.06 ms` (p50) | `0.32 ms` (p50) | **28.3x faster** (13.7x avg) |
| **Manager Analytics** | `8.34 ms` (p50) | `2.20 ms` (p50) | **3.8x faster** (4.0x avg) |

### Load Testing Summary
Running `node scripts/loadTest.js` with **25 concurrent workers** making 250 requests across read endpoints achieved:
- **Throughput**: 858.59 requests/sec
- **Success Rate**: 100%
- **Average Latency**: 28.54 ms (p50: 15.68 ms)
- **Cache Hit Ratio**: 90%

---

## 9. Running Benchmarks & Tests

```bash
# Run cache service unit tests
cd server && npx jest tests/unit/cacheService.test.js

# Run caching integration test suite
cd server && npx jest tests/integration/caching.test.js

# Run full performance benchmark suite
cd server && node scripts/benchmark.js

# Run concurrent load test script
cd server && node scripts/loadTest.js
```
