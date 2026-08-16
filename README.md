# Nestly — Production-Oriented Hotel Booking & Management Platform

Nestly is a modern, high-performance hotel discovery, management, and booking platform built on the **MERN Stack** (MongoDB, Express, React, Node.js).

---

## 🚀 Implemented Phases

### Phase 1: MERN Foundation
- Clean, calm hospitality UI/UX built with React 18, Vite, React Router DOM v6, and Tailwind CSS.
- RESTful API endpoints for hotel discovery, keyword search, location filtering, price ranges, ratings, and sorting.
- Responsive customer views: `HomePage`, `HotelListingPage`, `HotelDetailsPage`, search bar, room cards, image gallery, and filters.
- Robust Mongoose models: `User`, `Hotel`, `Room`, `Booking`, `Review`, `Payment`.

### Phase 2: Authentication & Authorization (RBAC)
- Secure password hashing with `bcryptjs` (salt factor 10) and `select: false` password protection.
- Secure session management via JWT tokens stored in **HTTP-only cookies** (`nestly_token`).
- `protect` middleware verifying tokens and `authorize` middleware enforcing Role-Based Access Control (`customer`, `manager`, `admin`).
- Public registration guard enforcing `role = customer` to prevent role escalation.
- Auth views: `LoginPage` (with quick-fill demo credentials), `RegisterPage`, `ProfilePage`, `ManagerDashboardPage`, `AdminDashboardPage`.

### Phase 3: Hotel & Room Management (Manager Portal)
- Authenticated **Manager Portal** (`/manager`) allowing property owners to create, view, edit, and deactivate hotels and room packages.
- **Backend Ownership Verification**: Reusable middleware `verifyHotelOwnership` and `verifyRoomOwnership` ensuring managers can only modify hotels they own (`Hotel.owner === req.user._id`). Unauthorized requests return `403 Forbidden`.
- **Soft Deactivation Strategy**: Deleting a property or room sets `status = 'inactive'`, retaining database document history for future booking/reporting analytics.
- **Automatic Price Recalculation**: Creating, updating, or deactivating a room package automatically recalculates the hotel's `startingPrice` based on active room rates.

### Phase 4: Booking Engine & Double-Booking Prevention
- **Date Overlap Algorithm**: Standard half-open date interval overlap query `(existingCheckIn < requestedCheckOut AND existingCheckOut > requestedCheckOut)` checking active bookings (`confirmed`, `pending`).
- **Double-Booking & Concurrency Protection**: Per-room async mutex lock (`acquireRoomLock`) combined with MongoDB Session Transaction isolation, guaranteeing serial evaluation of room inventory during reservation creation. If inventory is depleted, conflicting requests return `409 Conflict`.
- **Backend Pricing & Snapshot Engine**: Pure server-side pricing calculation (`subtotal = pricePerNight * nights * roomsBooked`, `taxes = 12%`). Permanent price snapshots are recorded on `Booking` documents, protecting historical reservations from future room rate alterations.

### Phase 5: Payment Integration (Razorpay Gateway Architecture)
- **Payment Provider Abstraction**: Dedicated payment manager (`paymentService.js`) and gateway driver (`razorpayProvider.js`). Decouples business logic from provider details, supporting Razorpay by default and enabling future gateway additions (e.g., Stripe).
- **Server-Side Amount Authority**: `POST /api/payments/create-order` accepts only `bookingId`. Reads `totalAmount` strictly from database `Booking` document.
- **Cryptographic HMAC-SHA256 Signature Verification**: `POST /api/payments/verify` computes `HMAC-SHA256(razorpayOrderId + "|" + razorpayPaymentId, secret)` and compares against payload. Forged signatures return `400 Bad Request`.
- **Webhook Listener Architecture**: `POST /api/payments/webhook` verifies `X-Razorpay-Signature` with `RAZORPAY_WEBHOOK_SECRET` and handles `payment.captured` & `payment.failed` events asynchronously.

### Phase 6: Notifications & Communication System
- **Decoupled Notification Architecture**: Event-driven communication engine (`notificationService.js`, `emailService.js`, `notificationTemplates.js`). Isolates communication delivery from core booking/payment controllers.
- **In-App Notification Engine**: Compound-indexed MongoDB model storing user-scoped notifications with read/unread tracking and deep link metadata.
- **HTML Email Transport & Templates**: Clean HTML email compiler with Nodemailer transport. Non-blocking wrapper ensures third-party email delivery failures never interrupt parent booking/payment transactions.
- **Frontend Header Bell & Notification Center**: `Navbar` bell badge with unread counter, `NotificationsPage` (`/notifications`), and `NotificationPreferencesPage` (`/settings/notifications`).

### Phase 7: Analytics & Reporting System
- **Server-Side MongoDB Aggregation Pipelines**: High-performance pipeline execution (`$match`, `$group`, `$lookup`, `$project`, `$facet`, `$sort`). Raw document arrays are never pulled into Node.js memory.
- **Strict Manager Ownership Scoping**: Every manager analytics query strictly filters by properties owned by `req.user._id` (`Hotel.find({ owner: req.user._id })`).
- **Industry-Standard Hospitality Formulas**: Net Revenue, Occupancy %, ADR (Average Daily Rate), RevPAR (Revenue Per Available Room), Cancellation Rate %, Average Stay, and Average Booking Value.
- **Interactive Manager & Admin Dashboards**: `ManagerAnalyticsPage` (`/manager/analytics`) and `AdminAnalyticsPage` (`/admin/analytics`).

### Phase 8: Reviews, Ratings & Reputation System
- **Server-Side Verified Stay Eligibility Engine**: Verified stay checks (`reviewEligibilityService.js`) ensuring only guests with completed stays (`checkOut <= now`) can review a hotel.
- **Database Models & Constraints**: `Review` model with unique compound index `{ booking: 1 }` enforcing one review per reservation. `ReviewReport` model for user abuse reporting.
- **Server-Side Aggregation Engine**: `ratingService.js` automatically recalculates hotel average ratings, 5-star distribution breakdowns, and category ratings (`cleanliness`, `location`, `service`, `value`).
- **Manager Responses & Admin Moderation**: Property managers post official responses (`/manager/reviews`), and administrators moderate flagged content (`/admin/moderation`).

### Phase 9: Security Hardening & Production Security
- **NoSQL Injection Prevention**: `express-mongo-sanitize` middleware recursively strips `$` and `.` operators from `req.body`, `req.query`, and `req.params`. Mongoose ObjectIds are strictly validated (`validateRequest.js`).
- **Tiered Rate Limiting (`express-rate-limit`)**: Protects auth endpoints (15 req/15 min), sensitive APIs (60 req/15 min), and public discovery APIs (300 req/15 min) against brute-force, bot spamming, and DoS attacks.
- **HTTP Security Headers & CORS**: Helmet CSP configured for Razorpay, Google Fonts, and Cloudinary. CORS origin whitelisting enforces environment-based origins.
- **Authentication & Mass Assignment Hardening**: Server-side password policy (min 8 chars, weak password dictionary check). Registration forces `role: 'customer'`. Profile updates prevent role escalation.
- **XSS Sanitization**: User-generated review comments, titles, hotel descriptions, and manager responses sanitized with `xss` library before database persistence.
- **Audit Logging System**: `AuditLog` model and `auditService` record login attempts, password changes, role escalation attempts, hotel modifications, payments, and review moderation. Admin portal available at `GET /api/admin/audit-logs`.
- **Production Error Sanitization**: Central error handler suppresses internal stack traces in production (`NODE_ENV === 'production'`).
- **Comprehensive Documentation**: Complete production security policy and incident response procedures detailed in `SECURITY.md`.

### Phase 11: Redis, Caching & Performance Optimization
- **Speed & Caching Layer**: Introduced Redis (`ioredis`) for high-speed caching while MongoDB remains the permanent source of truth.
- **Cache-Aside Pattern & Key Namespaces**: Implemented `cacheService.js` with structured key generation (`nestly:v1:hotel:*`, `nestly:v1:search:*`, `nestly:v1:room:*`, `nestly:v1:reviews:*`, `nestly:v1:analytics:*`).
- **Query Parameter Normalization & Hashing**: Search queries (`city`, `minPrice`, `maxPrice`, `sort`) are sorted deterministically and SHA-256 hashed to guarantee cache hits regardless of query string key ordering.
- **Selective Cache Invalidation Matrix**: Hotel, room, review, and booking writes automatically purge relevant cache keys using pattern-based scanning (`SCAN`), guaranteeing users never view stale data.
- **Fail-Safe MongoDB Fallback (Degraded Mode)**: If Redis goes down or is offline, Nestly logs a warning and seamlessly falls back to MongoDB without interrupting application runtime.
- **Distributed Rate Limiting (`rate-limit-redis`)**: Integrated Redis store into express rate limiters with memory store fallback when Redis is offline.
- **Health Metrics Endpoint**: Enhanced `/health` and `/api/health` endpoints returning system status (`ok`, `degraded`), database/redis health, and live cache metrics (`hits`, `misses`, `errors`, `hitRatio`). Added `/api/cache/metrics`.
- **Empirical Benchmarks & Load Testing**: Integrated automated benchmark (`scripts/benchmark.js`) and load test (`scripts/loadTest.js`) suites. Achieved **10x–28x latency speedups** for cached read endpoints.
- **Detailed Cache Documentation**: Comprehensive architecture, key rules, and fallbacks documented in `docs/CACHING.md`.

### Phase 13: Docker & Containerization
- **Multi-Stage Backend Dockerfile (`server/Dockerfile`)**: Lightweight `node:20-alpine` production image with non-root security (`USER node`), zero secrets baked in, and `/health` probe.
- **Multi-Stage Frontend Dockerfile (`client/Dockerfile`)**: `node:20-alpine` build stage producing minified React static assets -> `nginx:1.25-alpine` runtime stage.
- **Nginx Reverse Proxy (`client/nginx.conf`)**: Serves React SPA on port `80`, handles SPA routing fallback (`try_files $uri /index.html`), and proxies `/api/*` requests internally to `http://backend:5000/api/*`.
- **Full-Stack Docker Compose (`docker-compose.yml`)**: Orchestrates 4 isolated services (`frontend`, `backend`, `mongodb`, `redis`) on private `nestly-network`.
- **Database & Cache Persistence**: Named Docker volume `mongodb_data` for persistent MongoDB storage; ephemeral Redis cache layer.
- **Service Healthchecks**: Automated container health monitoring and startup ordering (`depends_on: { condition: service_healthy }`).
- **Comprehensive Documentation**: Complete architecture, networking, security, and troubleshooting guide in `docs/DOCKER.md`.

---

## 🐳 Docker Quick Start

To launch Nestly's complete 4-container stack locally:

```bash
# 1. Build images and start container stack
docker compose up -d --build

# 2. Check service health status
docker compose ps

# 3. Access applications:
# Frontend SPA:  http://localhost:3000
# Backend API:   http://localhost:5000/health
```

---

## 🔑 Demo Test Accounts

All accounts use password: `password123`

| Role | Email | Permissions |
| :--- | :--- | :--- |
| **Customer** | `customer@example.com` | Hotel discovery, search, filtering, room viewing, availability checking, reservation creation, online payment, in-app & email notifications, verified stay reviews, customer review portal |
| **Manager** | `manager@example.com` | Hotel property CRUD, room inventory management, property reservation monitoring, property analytics dashboard, property review responses |
| **Admin** | `admin@example.com` | Platform administration, full property access, platform-wide analytics & hotel performance ranking, review moderation queue, security audit log inspection |

---

## ⚙️ Environment Configuration

Add the following environment variables to `server/.env`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/nestly
JWT_SECRET=your_jwt_secret_key_change_in_production_2026
COOKIE_NAME=nestly_token
FRONTEND_URL=http://localhost:5173
REDIS_URL=redis://localhost:6379
```

---

## 🧪 Verification & Testing Suites

To run automated backend verification suites:

```bash
cd server
# Phase 1-9 Integration & Security Verification
npx jest tests/integration/security.test.js
npx jest tests/integration/reviews.test.js
npx jest tests/integration/analytics.test.js

# Phase 11: Unit & Integration Caching Tests
npx jest tests/unit/cacheService.test.js
npx jest tests/integration/caching.test.js

# Phase 11: Performance Benchmarks & Load Tests
node scripts/benchmark.js
node scripts/loadTest.js
```

---

## ⚙️ Phase 14: CI/CD Pipeline & Code Quality

Nestly uses GitHub Actions for continuous integration, linting, security audits, containerized integration tests, and Docker image build validation.

### Workflow Pipelines (`.github/workflows/`)

- **`ci.yml` (Main CI Pipeline)**:
  - **Quality & Security**: ESLint (`--max-warnings 0`), secret pattern regex scan, `npm audit`.
  - **Testing**: Runs full Jest test suite with coverage (`npm run test:coverage`) against MongoDB 7.0 & Redis 7.2 container services.
  - **Build**: Compiles production frontend bundle using Vite (`npm run build`).
- **`docker.yml` (Docker Build Validation)**:
  - Validates `nestly-backend` and `nestly-frontend` multi-stage Dockerfiles via `docker/build-push-action@v5`.

### Local CI Reproduction

```bash
# 1. Clean Dependency Installation
npm ci && cd server && npm ci && cd ../client && npm ci && cd ..

# 2. ESLint Code Quality Verification
npm run lint

# 3. Automated Test Suite with Coverage
npm run test:coverage

# 4. Frontend Production Build
npm run build

# 5. Docker Container Build
docker compose build
```

See [docs/CICD.md](file:///c:/Users/shari/OneDrive/Desktop/Nestly/docs/CICD.md) for complete pipeline documentation.

