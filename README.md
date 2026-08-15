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
- Manager Views: `ManagerDashboardPage` (overview metrics & property list), `HotelFormPage` (`/manager/hotels/new` & `/manager/hotels/:id/edit`), `ManagerHotelDetailsPage` (`/manager/hotels/:id`), and `RoomFormModal`.
- Public Integration: Active hotels and available rooms automatically appear in public search and discovery (`/hotels`).

### Phase 4: Booking Engine & Double-Booking Prevention
- **Date Overlap Algorithm**: Standard half-open date interval overlap query `(existingCheckIn < requestedCheckOut AND existingCheckOut > requestedCheckOut)` checking active bookings (`confirmed`, `pending`).
- **Double-Booking & Concurrency Protection**: Per-room async mutex lock (`acquireRoomLock`) combined with MongoDB Session Transaction isolation, guaranteeing serial evaluation of room inventory during reservation creation. If inventory is depleted, conflicting requests return `409 Conflict`.
- **Backend Pricing & Snapshot Engine**: Pure server-side pricing calculation (`subtotal = pricePerNight * nights * roomsBooked`, `taxes = 12%`). Permanent price snapshots are recorded on `Booking` documents, protecting historical reservations from future room rate alterations.
- **Booking Reference Generator**: Generates human-readable unique reference codes (e.g. `NST-2026-X8K9L2`).
- **Customer & Manager UI Flows**: `AvailabilityPicker` widget on `HotelDetailsPage`, `BookingReviewPage` (`/bookings/review`), `CustomerBookingsPage` (`/bookings`), `BookingDetailsPage` (`/bookings/:id`), and `ManagerBookingsPage` (`/manager/bookings`).

### Phase 5: Payment Integration (Razorpay Gateway Architecture)
- **Payment Provider Abstraction**: Dedicated payment manager (`paymentService.js`) and gateway driver (`razorpayProvider.js`). Decouples business logic from provider details, supporting Razorpay by default and enabling future gateway additions (e.g., Stripe).
- **Server-Side Amount Authority**: `POST /api/payments/create-order` accepts only `bookingId`. Reads `totalAmount` strictly from database `Booking` document and converts to subunits (`paise`). Client-submitted price overrides are strictly ignored.
- **Cryptographic HMAC-SHA256 Signature Verification**: `POST /api/payments/verify` computes `HMAC-SHA256(razorpayOrderId + "|" + razorpayPaymentId, secret)` and compares against the payload. Forged signatures return `400 Bad Request`.
- **Webhook Listener Architecture**: `POST /api/payments/webhook` verifies `X-Razorpay-Signature` with `RAZORPAY_WEBHOOK_SECRET` and handles `payment.captured` & `payment.failed` events asynchronously.
- **Idempotency & Duplicate Guard**: Re-sending payment verification or webhook triggers checks `payment.status === 'paid'` and returns existing payment records without duplicate processing or double-charging.
- **Customer & Manager Payment UI**:
  - `PaymentModal`: Razorpay Checkout integration with built-in test-mode sandbox simulation.
  - `BookingDetailsPage` & `CustomerBookingsPage`: `Payment Status: Paid` emerald badge and `Pay Now` CTA for unpaid reservations.
  - `ManagerBookingsPage`: Transaction visibility and payment status tracking across owned properties.

---

## 🔑 Demo Test Accounts

All accounts use password: `password123`

| Role | Email | Permissions |
| :--- | :--- | :--- |
| **Customer** | `customer@example.com` | Hotel discovery, search, filtering, room viewing, availability checking, reservation creation, online payment, booking cancellation |
| **Manager** | `manager@example.com` | Hotel property CRUD, room inventory management, property reservation monitoring & payment visibility |
| **Admin** | `admin@example.com` | Platform administration & full property access |

---

## 🛠️ API Reference

### Authentication Endpoints
- `POST /api/auth/register` — Register customer account
- `POST /api/auth/login` — User authentication & HTTP-only cookie issuance
- `POST /api/auth/logout` — Invalidate session cookie
- `GET /api/auth/me` — Fetch authenticated user profile

### Hotel & Room Endpoints
- `GET /api/hotels` — Public hotel discovery (Active hotels only)
- `GET /api/hotels/:id` — Public hotel details & available rooms
- `GET /api/hotels/manager/my-hotels` — Manager owned properties list (`protect`, `authorize('manager', 'admin')`)
- `POST /api/hotels` — Create hotel property (`protect`, `authorize('manager', 'admin')`)

### Booking Endpoints
- `POST /api/bookings/quote` — Public server price quote calculation
- `POST /api/bookings` — Create reservation (`protect`)
- `GET /api/bookings/my` — Customer reservation history (`protect`)
- `GET /api/bookings/:id` — View reservation receipt details (`protect`)
- `POST /api/bookings/:id/cancel` — Cancel reservation & release inventory (`protect`)
- `GET /api/bookings/manager/all` — Manager property reservations (`protect`, `authorize('manager', 'admin')`)

### Payment Endpoints
- `POST /api/payments/create-order` — Create gateway order using server amount authority (`protect`)
- `POST /api/payments/verify` — Verify HMAC-SHA256 signature and mark reservation `paid` (`protect`)
- `POST /api/payments/webhook` — Razorpay webhook listener (Public, verified via signature header)
- `GET /api/payments/my` — Customer payment history (`protect`)
- `GET /api/payments/manager/all` — Manager payment overview across owned properties (`protect`, `authorize('manager', 'admin')`)

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
node test_phase4.js   # Phase 4: Booking Engine & Concurrency Double-Booking Suite
node test_phase5.js   # Phase 5: Payment Integration Security & Verification Suite
```
