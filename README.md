# Nestly — Production-Oriented Hotel Discovery & Booking Platform

**Nestly** is a minimal, modern, and trustworthy hotel discovery and booking platform built with the MERN stack.

Phase 1 focuses on the **customer-facing discovery experience**, modular backend architecture, foundational database schemas, seed data, and a clean hospitality design system.

---

## 🚀 Features (Phase 1 — MERN Foundation)

- **Hospitality UI/UX Design System**: Minimal, clean, calm navy/slate palette built with Tailwind CSS. Responsive across Desktop, Tablet, and Mobile.
- **Home Page (`/`)**: Hero destination search bar, featured hotels, top destinations (Delhi, Mumbai, Goa, Bengaluru, Jaipur), and customer trust highlights.
- **Hotel Listing (`/hotels`, `/search`)**: Server-driven keyword search, city filtering, price range presets, star rating filtering, and sorting (Price Low/High, Rating, Newest).
- **Hotel Details (`/hotels/:id`)**: Photo gallery with thumbnail selection, full hotel description, popular amenities list, and available room packages.
- **Room Cards & Booking Notice**: Detailed room cards with guest capacity, room amenities, and price per night, with an interactive Phase 4 notice modal when clicking "Book Now".
- **Modular REST API**: Clean Express controllers, services, models, and routes with Helmet security middleware, CORS, and centralized error handling.
- **Mongoose Database Schemas**: Production-ready schemas for `User`, `Hotel`, `Room`, `Booking`, `Review`, and `Payment` ready for future phase extensions.
- **Automated Database Seeding**: Pre-populated script featuring 12 realistic hotels across major cities with Unsplash photos, ratings, amenities, and room templates.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 + Vite
- **Routing**: React Router DOM v6
- **Styling**: Tailwind CSS + Custom Hospitality Palette
- **Icons**: Lucide React
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js + Express.js
- **Database**: MongoDB + Mongoose ODM
- **Middleware**: Helmet, CORS, Centralized Error Middleware
- **Environment**: dotenv

---

## 📁 Project Architecture & Directory Structure

```text
Nestly/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── SearchBar.jsx
│   │   │   ├── HotelCard.jsx
│   │   │   ├── RoomCard.jsx
│   │   │   ├── FilterSidebar.jsx
│   │   │   ├── SortDropdown.jsx
│   │   │   ├── ImageGallery.jsx
│   │   │   ├── LoadingSkeleton.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   ├── ErrorAlert.jsx
│   │   │   └── BookingNoticeModal.jsx
│   │   ├── layouts/
│   │   │   └── MainLayout.jsx
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── HotelListingPage.jsx
│   │   │   ├── HotelDetailsPage.jsx
│   │   │   └── NotFoundPage.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── hotelService.js
│   │   ├── utils/
│   │   │   └── formatters.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── hotelController.js
│   │   └── roomController.js
│   ├── middleware/
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Hotel.js
│   │   ├── Room.js
│   │   ├── Booking.js
│   │   ├── Review.js
│   │   └── Payment.js
│   ├── routes/
│   │   ├── hotelRoutes.js
│   │   └── roomRoutes.js
│   ├── seed.js
│   ├── app.js
│   ├── server.js
│   └── package.json
│
├── .env.example
├── .gitignore
├── README.md
└── package.json
```

---

## ⚡ Quick Start & Setup Instructions

### 1. Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)
- MongoDB (Local instance or MongoDB Atlas URI)

### 2. Installation
Install all dependencies for root, server, and client:

```bash
# From the root directory
npm run setup
```

### 3. Environment Variables
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
```

### 4. Database Seeding
Populate the database with realistic demo hotels, rooms, and images:

```bash
npm run seed
```

### 5. Running the Application
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

### Health Endpoint
- `GET /api/health` — API service health check

### Hotels
- `GET /api/hotels` — Fetch all hotels. Accepts query parameters:
  - `location` (string)
  - `search` (keyword)
  - `minPrice` (number)
  - `maxPrice` (number)
  - `minRating` (number)
  - `sort` (`price_asc` | `price_desc` | `rating_desc` | `newest`)
- `GET /api/hotels/:id` — Get single hotel details with available rooms
- `POST /api/hotels` — Create new hotel (Foundation)
- `PUT /api/hotels/:id` — Update hotel details (Foundation)
- `DELETE /api/hotels/:id` — Remove hotel (Foundation)

### Rooms
- `GET /api/hotels/:hotelId/rooms` — Fetch rooms for specific hotel
- `GET /api/rooms/:id` — Fetch single room details

---

## 🗺️ Project Roadmap

```text
Phase 1  → MERN Foundation       [Current]
Phase 2  → Authentication (JWT & Password Hashing)
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
