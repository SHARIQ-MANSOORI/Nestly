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
- **Decoupled Notification Architecture**: Event-driven communication engine (`notificationService.js`, `emailService.js`, `notificationTemplates.js`). Isolates communication delivery from core booking/payment controllers, preparing the system for Phase 12 Redis + BullMQ queue workers.
- **In-App Notification Engine ([Notification.js](file:///c:/Users/shari/OneDrive/Desktop/Nestly/server/models/Notification.js))**: Compound-indexed MongoDB model storing user-scoped notifications with read/unread tracking and deep link metadata.
- **HTML Email Transport & Templates**: Clean HTML email compiler with Nodemailer transport. Non-blocking wrapper ensures third-party email delivery failures never interrupt parent booking/payment transactions.
- **Frontend Header Bell & Notification Center**: `Navbar` bell badge with unread counter, `NotificationsPage` (`/notifications`), and `NotificationPreferencesPage` (`/settings/notifications`).

### Phase 7: Analytics & Reporting System
- **Server-Side MongoDB Aggregation Pipelines**: High-performance pipeline execution (`$match`, `$group`, `$lookup`, `$project`, `$facet`, `$sort`). Raw document arrays are never pulled into Node.js memory.
- **Strict Manager Ownership Scoping**: Every manager analytics query strictly filters by properties owned by `req.user._id` (`Hotel.find({ owner: req.user._id })`).
- **Industry-Standard Hospitality Formulas**:
  - **Net Revenue**: `Gross Revenue - Refunds` (excludes failed/unpaid/cancelled).
  - **Occupancy %**: `(Booked Room Nights / Available Room Nights) * 100`.
  - **ADR (Average Daily Rate)**: `Room Revenue / Sold Room Nights`.
  - **RevPAR (Revenue Per Available Room)**: `Room Revenue / Available Room Nights`.
  - **Cancellation Rate %**, **Average Stay**, and **Average Booking Value**.
- **Interactive Manager & Admin Dashboards**:
  - `ManagerAnalyticsPage` (`/manager/analytics`): KPI Grid, Date Range Filter (`Today`, `7D`, `30D`, `This Month`, `Last Month`, `This Year`, `Custom`), Recharts Line & Bar charts for Revenue & Booking volume trends, Room Performance breakdown table, Upcoming Stays widget, and Recent Transactions widget.
  - `AdminAnalyticsPage` (`/admin/analytics`): Platform-wide revenue trends, user metrics, and top-performing hotel rankings.

---

## 🔑 Demo Test Accounts

All accounts use password: `password123`

| Role | Email | Permissions |
| :--- | :--- | :--- |
| **Customer** | `customer@example.com` | Hotel discovery, search, filtering, room viewing, availability checking, reservation creation, online payment, in-app & email notifications, booking cancellation |
| **Manager** | `manager@example.com` | Hotel property CRUD, room inventory management, property reservation monitoring, manager event notifications, property analytics dashboard |
| **Admin** | `admin@example.com` | Platform administration, full property access, platform-wide analytics & hotel performance ranking |

---

## 🛠️ API Reference

### Analytics Endpoints
- `GET /api/analytics/manager/overview` — Fetch manager property analytics (`protect`, `authorize('manager', 'admin')`)
  - Query params: `filter` (`today` | `7d` | `30d` | `this_month` | `last_month` | `this_year` | `custom`), `from`, `to`
- `GET /api/analytics/admin/overview` — Fetch platform-wide admin analytics (`protect`, `authorize('admin')`)
  - Query params: `filter`, `from`, `to`

---

## 💻 Quick Start & Running Locally

### 1. Start Express Backend
```bash
cd server
npm install
npm run seed     # Populate database with demo accounts, hotels, and rooms
npm start        # Launches backend server on http://localhost:5000
```

### 2. Start Vite Frontend
```bash
cd client
npm install
npm run dev      # Launches Vite frontend dev server on http://localhost:5173
```

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
```
