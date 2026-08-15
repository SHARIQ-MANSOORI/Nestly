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

---

## 🔑 Demo Test Accounts

All accounts use password: `password123`

| Role | Email | Permissions |
| :--- | :--- | :--- |
| **Customer** | `customer@example.com` | Hotel discovery, search, filtering, room viewing, availability checking, reservation creation, online payment, in-app & email notifications, verified stay reviews, customer review portal |
| **Manager** | `manager@example.com` | Hotel property CRUD, room inventory management, property reservation monitoring, property analytics dashboard, property review responses |
| **Admin** | `admin@example.com` | Platform administration, full property access, platform-wide analytics & hotel performance ranking, review moderation queue, security audit log inspection |

---

## 🧪 Verification & Testing Suites

To run automated backend verification suites:

```bash
cd server
node test_api.js      # Phase 1: Discovery & Filter API Suite
node test_auth.js     # Phase 2: Auth, JWT, Cookie & RBAC Suite
node test_phase3.js   # Phase 3: Hotel & Room Management Ownership Suite
node test_phase4.js   # Phase 4: Booking Engine & Concurrency Suite
node test_phase5.js   # Phase 5: Payment Integration Security Suite
node test_phase6.js   # Phase 6: Notifications & Communication Event Suite
node test_phase7.js   # Phase 7: Analytics & Reporting Aggregation Suite
node test_phase8.js   # Phase 8: Reviews, Ratings & Reputation Suite
node test_security.js # Phase 9: Security Hardening & Penetration Testing Suite
```
