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
- **Date Overlap Algorithm**: Standard half-open date interval overlap query `(existingCheckIn < requestedCheckOut AND existingCheckOut > requestedCheckIn)` checking active bookings (`confirmed`, `pending`).
- **Double-Booking & Concurrency Protection**: Per-room async mutex lock (`acquireRoomLock`) combined with MongoDB Session Transaction isolation, guaranteeing serial evaluation of room inventory during reservation creation. If inventory is depleted, conflicting requests return `409 Conflict`.
- **Backend Pricing & Snapshot Engine**: Pure server-side pricing calculation (`subtotal = pricePerNight * nights * roomsBooked`, `taxes = 12%`). Permanent price snapshots are recorded on `Booking` documents, protecting historical reservations from future room rate alterations.
- **Booking Reference Generator**: Generates human-readable unique reference codes (e.g. `NST-2026-X8K9L2`).
- **Customer & Manager UI Flows**:
  - `AvailabilityPicker` widget on `HotelDetailsPage`: Interactive check-in/out date selection, live availability query, and itemized rate calculation.
  - `BookingReviewPage` (`/bookings/review`): Reservation confirmation review screen.
  - `CustomerBookingsPage` (`/bookings`) & `BookingDetailsPage` (`/bookings/:id`): Customer reservation history and receipt view with single-click cancellation functionality.
  - `ManagerBookingsPage` (`/manager/bookings`): Property reservation monitoring view for managers.

---

## 🔑 Demo Test Accounts

All accounts use password: `password123`

| Role | Email | Permissions |
| :--- | :--- | :--- |
| **Customer** | `customer@example.com` | Hotel discovery, search, filtering, room viewing, availability checking, reservation creation, booking cancellation |
| **Manager** | `manager@example.com` | Hotel property CRUD, room inventory management, property reservation monitoring |
| **Admin** | `admin@example.com` | Platform administration & full property access |

---

## 🛠️ API Reference

### Authentication Endpoints
- `POST /api/auth/register` — Register customer account
- `POST /api/auth/login` — User authentication & HTTP-only cookie issuance
- `POST /api/auth/logout` — Invalidate session cookie
- `GET /api/auth/me` — Fetch authenticated user profile
- `PUT /api/auth/profile` — Update name & avatar
- `PUT /api/auth/change-password` — Change password

### Hotel Endpoints
- `GET /api/hotels` — Public hotel discovery (Active hotels only)
- `GET /api/hotels/:id` — Public hotel details & available rooms
- `GET /api/hotels/manager/my-hotels` — Manager owned properties list (`protect`, `authorize('manager', 'admin')`)
- `POST /api/hotels` — Create hotel property (`protect`, `authorize('manager', 'admin')`)
- `PUT /api/hotels/:id` — Edit hotel property (`protect`, `authorize('manager', 'admin')`, `verifyHotelOwnership`)
- `DELETE /api/hotels/:id` — Soft deactivate hotel (`protect`, `authorize('manager', 'admin')`, `verifyHotelOwnership`)

### Room & Availability Endpoints
- `GET /api/hotels/:hotelId/rooms` — Public room options
- `GET /api/rooms/:id` — Public room details
- `GET /api/hotels/:hotelId/rooms/:roomId/availability` — Public availability check & live rate calculation
- `POST /api/hotels/:hotelId/rooms` — Add room package (`protect`, `authorize('manager', 'admin')`, `verifyHotelOwnership`)
- `PUT /api/rooms/:id` — Update room package (`protect`, `authorize('manager', 'admin')`, `verifyRoomOwnership`)
- `DELETE /api/rooms/:id` — Soft deactivate room (`protect`, `authorize('manager', 'admin')`, `verifyRoomOwnership`)

### Booking Endpoints
- `POST /api/bookings/quote` — Public server price quote calculation
- `POST /api/bookings` — Create reservation (`protect`)
- `GET /api/bookings/my` — Customer reservation history (`protect`)
- `GET /api/bookings/:id` — View reservation receipt details (`protect`)
- `POST /api/bookings/:id/cancel` — Cancel reservation & release inventory (`protect`)
- `GET /api/bookings/manager/all` — Manager property reservations (`protect`, `authorize('manager', 'admin')`)

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
```
