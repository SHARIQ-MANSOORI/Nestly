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
- **HTML Email Transport & Templates**: Clean HTML email compiler with Nodemailer transport (and built-in dev console logger fallback). Non-blocking wrapper ensures third-party email delivery failures never interrupt parent booking/payment transactions.
- **User Notification Preferences ([User.js](file:///c:/Users/shari/OneDrive/Desktop/Nestly/server/models/User.js))**: Preference controls for email & in-app toggles (`emailBookingConfirmation`, `emailPaymentUpdates`, `emailCancellationUpdates`, `emailManagerBookingUpdates`, `inAppBookingUpdates`, `inAppPaymentUpdates`).
- **Frontend Header Bell & Notification Center**:
  - `Navbar`: Interactive Notification Bell `🔔` with unread count badge and quick dropdown preview.
  - `NotificationsPage` (`/notifications`): Full notification history list, filters, "Mark All as Read", delete actions, and deep-link click navigation to `/bookings/:id`.
  - `NotificationPreferencesPage` (`/settings/notifications`): User preferences configuration page.

---

## 🔑 Demo Test Accounts

All accounts use password: `password123`

| Role | Email | Permissions |
| :--- | :--- | :--- |
| **Customer** | `customer@example.com` | Hotel discovery, search, filtering, room viewing, availability checking, reservation creation, online payment, in-app & email notifications, booking cancellation |
| **Manager** | `manager@example.com` | Hotel property CRUD, room inventory management, property reservation monitoring, manager event notifications |
| **Admin** | `admin@example.com` | Platform administration & full property access |

---

## 🛠️ API Reference

### Notification Endpoints
- `GET /api/notifications` — Fetch authenticated user's notifications (`protect`)
- `GET /api/notifications/unread-count` — Fetch unread count (`protect`)
- `PATCH /api/notifications/:id/read` — Mark single notification as read (`protect`)
- `PATCH /api/notifications/read-all` — Mark all user notifications as read (`protect`)
- `DELETE /api/notifications/:id` — Delete notification (`protect`)
- `GET /api/notifications/preferences` — Get notification preferences (`protect`)
- `PUT /api/notifications/preferences` — Update notification preferences (`protect`)

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
```
