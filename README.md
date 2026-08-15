# Nestly — Production-Oriented Hotel Discovery & Booking Platform

**Nestly** is a minimal, modern, and trustworthy hotel discovery and booking platform built with the MERN stack.

- **Phase 1**: Customer-facing hotel discovery experience, search/filter/sort capabilities, Mongoose database schemas, and realistic seed data.
- **Phase 2 (Current)**: Secure authentication, bcrypt password hashing, JWT via HTTP-only cookies, profile management, protected routes, and Role-Based Access Control (RBAC) for **Customer**, **Manager**, and **Admin** accounts.

---

## 🚀 Features

### Phase 1 — MERN Foundation
- **Hospitality UI/UX Design System**: Minimal, clean, calm navy/slate palette built with Tailwind CSS. Responsive across Desktop, Tablet, and Mobile.
- **Home Page (`/`)**: Hero destination search bar, featured hotels, top destinations (Delhi, Mumbai, Goa, Bengaluru, Jaipur), and customer trust highlights.
- **Hotel Listing (`/hotels`, `/search`)**: Server-driven keyword search, city filtering, price range presets, star rating filtering, and sorting (Price Low/High, Rating, Newest).
- **Hotel Details (`/hotels/:id`)**: Photo gallery with thumbnail selection, full hotel description, popular amenities list, and available room packages.
- **Room Cards & Booking Notice**: Detailed room cards with guest capacity, room amenities, and price per night, with an interactive Phase 4 notice modal when clicking "Book Now".

### Phase 2 — Authentication & Authorization
- **Security & Password Hashing**: Passwords encrypted with `bcryptjs` (salt factor 10) in `pre('save')` hooks; `select: false` by default on queries.
- **HTTP-Only Cookie Authentication**: JWT tokens signed and transmitted via secure `httpOnly` cookies (`nestly_token`), shielding tokens from XSS/client-side access.
- **Public Registration Guard**: Registration strictly forces the `customer` role to eliminate privilege escalation vectors.
- **Role-Based Access Control (RBAC)**: Backend middleware (`protect` & `authorize`) enforcing role permissions (`customer`, `manager`, `admin`).
- **Profile & Security**: `/profile` page supporting name/avatar edits and current password verification + new password hashing.
- **Protected Dashboards**: Protected UI placeholders `/manager` (for Managers/Admins) and `/admin` (for Admins only).

---

## 👥 Local Development Test Accounts

Pre-seeded via `npm run seed` with local test credentials:

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Customer** | `customer@example.com` | `password123` | Hotel discovery, search, view profile, change password |
| **Manager** | `manager@example.com` | `password123` | Customer rights + `/manager` dashboard |
| **Admin** | `admin@example.com` | `password123` | Full access + `/admin` & `/manager` dashboards |

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 + Vite
- **Routing**: React Router DOM v6
- **State & Auth Context**: React Context (`AuthContext` & `useAuth`)
- **Styling**: Tailwind CSS + Custom Hospitality Palette
- **Icons**: Lucide React
- **HTTP Client**: Axios (`withCredentials: true`)

### Backend
- **Runtime**: Node.js + Express.js
- **Database**: MongoDB + Mongoose ODM
- **Security**: bcryptjs, jsonwebtoken, cookie-parser, Helmet, CORS
- **Environment**: dotenv

---

## ⚡ Quick Start & Setup Instructions

### 1. Installation
Install all dependencies for root, server, and client:

```bash
# From the root directory
npm run setup
```

### 2. Environment Variables
Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Default environment variables:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/nestly
CLIENT_URL=http://localhost:5173
VITE_API_BASE_URL=http://localhost:5000/api
JWT_SECRET=nestly_jwt_secret_dev_key_2026_change_in_production
JWT_EXPIRES_IN=7d
COOKIE_NAME=nestly_token
```

### 3. Database Seeding
Populate the database with demo hotels, rooms, and test users:

```bash
npm run seed
```

### 4. Running the Application
To run both backend and frontend concurrently:

```bash
npm run dev
```

Or run them individually:
```bash
# Start backend API (Port 5000)
npm run server

# Start frontend Vite dev server (Port 5173)
npm run client
```

Open `http://localhost:5173` in your browser.

---

## 🔌 API Documentation Overview

### Authentication API
- `POST /api/auth/register` — Register customer account
- `POST /api/auth/login` — Sign in & receive HTTP-only JWT cookie
- `POST /api/auth/logout` — Invalidate authentication cookie
- `GET /api/auth/me` — Fetch authenticated user profile (Protected)
- `PUT /api/auth/profile` — Update name / profile image (Protected)
- `PUT /api/auth/change-password` — Verify current & update password (Protected)
- `GET /api/auth/manager-area` — Manager/Admin protected test route (Protected)
- `GET /api/auth/admin-area` — Admin protected test route (Protected)

### Hotels API
- `GET /api/hotels` — Fetch hotels with search, city, price range, rating filters, and sorting
- `GET /api/hotels/:id` — Get single hotel details with rooms
- `POST /api/hotels`, `PUT /api/hotels/:id`, `DELETE /api/hotels/:id` — Manager foundation

### Rooms API
- `GET /api/hotels/:hotelId/rooms` — Fetch rooms for specific hotel
- `GET /api/rooms/:id` — Fetch single room details

---

## 🗺️ Project Roadmap

```text
Phase 1  → MERN Foundation                       [Completed]
Phase 2  → Authentication & Authorization (RBAC) [Completed]
Phase 3  → Hotel Management (Manager Portal)
Phase 4  → Booking Engine & Availability Lock
Phase 5  → Payments Integration (Razorpay / Stripe)
Phase 6  → Notifications & Email Service
Phase 7  → Revenue & Admin Dashboards
Phase 8  → User Reviews & Ratings Submission
Phase 9  → Security Hardening & Rate Limiting
Phase 10 → Automated End-to-End Testing
Phase 11 → Redis Caching Layer
Phase 12 → Background Workers & BullMQ
Phase 13 → Docker Containerization
Phase 14 → CI/CD Deployment Pipelines
Phase 15 → AWS Cloud Infrastructure
Phase 16 → Monitoring & Observability (Prometheus / Grafana)
Phase 17 → Global Scalability & CDN
```
