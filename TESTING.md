# Nestly — Phase 10: Advanced Testing & Quality Engineering

This document outlines the testing architecture, quality gates, automated test suites, and regression defense mechanisms for **Nestly** — production-oriented hotel booking and hotel management platform.

---

## 1. Testing Strategy Overview

Nestly employs a multi-tiered testing strategy following the **Testing Pyramid**:

```
           / \
          /   \     E2E Playwright Tests (User Journey Flows)
         /-----\
        /       \   API & Security Integration Tests (Supertest + MongoDB Memory Server)
       /---------\
      /           \ Component Unit Tests (Vitest + React Testing Library)
     /-------------\
    /               \ Pure Unit Tests (Pricing, Date Math, Eligibility, Ratings)
   /-----------------\
```

---

## 2. Test Environment & Database Isolation

All backend unit and integration tests run against **MongoDB Memory Server** (`mongodb-memory-server`), ensuring:
- Zero dependency on external database infrastructure.
- Complete data isolation per test file.
- Automatic database spin-up, collection teardown (`clearDatabase`), and clean shutdown (`closeDatabase`).

---

## 3. Test Suites & File Structure

```
Nestly/
├── server/
│   ├── jest.config.js               # Backend Jest Test Runner Config
│   └── tests/
│       ├── helpers/
│       │   └── dbHandler.js         # MongoDB Memory Server Lifecycle
│       ├── fixtures/
│       │   └── fixtures.js          # Reusable Users, Hotel, Room, & Booking Fixtures
│       ├── unit/
│       │   ├── pricingService.test.js           # Date math, night calculations, tax, subtotal
│       │   ├── availabilityService.test.js      # Room availability interval overlaps
│       │   ├── ratingService.test.js            # Rating aggregations & star distributions
│       │   └── reviewEligibilityService.test.js # Verified stay eligibility checks
│       └── integration/
│           ├── auth.test.js                    # Registration, login, JWT cookies, RBAC
│           ├── hotels_rooms.test.js            # Property CRUD, starting price math, soft delete
│           ├── bookings_concurrency.test.js    # Concurrency mutex locks, double-booking prevention
│           ├── payments.test.js                # HMAC signature verification, idempotency
│           ├── notifications.test.js           # In-app notifications & read tracking
│           ├── analytics.test.js               # Manager property scoping & admin metrics
│           ├── reviews.test.js                 # Review lifecycle, responses, admin moderation
│           └── security.test.js                # NoSQL injection, XSS, rate limiting, audit trailing
├── client/
│   ├── vite.config.js               # Vitest + jsdom Setup
│   └── src/__tests__/
│       ├── setup.js                 # Testing Library Setup & DOM Cleanup
│       ├── Navbar.test.jsx          # Role-aware Navigation Bar & Notifications
│       ├── HotelCard.test.jsx       # Property Card Display & Rating Badges
│       ├── RatingBreakdown.test.jsx # 5-Star Distribution & Category Ratings
│       └── ReviewCard.test.jsx      # Verified Stay Badge & Manager Response Box
└── e2e/
    ├── customer-flow.spec.js        # Playwright E2E Customer Discovery & Booking Flow
    ├── manager-flow.spec.js         # Playwright E2E Manager Dashboard & Property Management Flow
    └── admin-security-flow.spec.js  # Playwright E2E Admin Audit Trail & Moderation Flow
```

---

## 4. How to Run Tests

### Run All Unit, Integration, & Frontend Component Tests
```bash
npm test
```

### Run Backend Unit Tests Only
```bash
npm run test:unit
```

### Run Backend API & Integration Tests Only
```bash
npm run test:integration
```

### Run Frontend React Component Tests (Vitest)
```bash
npm run test:frontend
```

### Run Playwright E2E Tests
```bash
npm run test:e2e
```

### Generate Code Coverage Report
```bash
npm run test:coverage
```

### Build Production Bundle Verification
```bash
npm run build
```

---

## 5. Automated Quality Gates

Prior to merging any pull request or deploying to staging/production, the code MUST pass the following automated quality checks:
1. `npm run test:unit` (100% Pass Rate)
2. `npm run test:integration` (100% Pass Rate)
3. `npm run test:frontend` (100% Pass Rate)
4. `npm run build` (Clean production bundle build with zero errors)
