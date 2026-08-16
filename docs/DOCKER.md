# Nestly Docker & Containerization Guide (Phase 13)

This document provides a comprehensive guide to Nestly's containerized architecture, multi-stage Dockerfiles, Docker Compose setup, network communication, health checks, data persistence, security rules, and troubleshooting procedures.

---

## 1. High-Level Container Architecture

```
                                    CLIENT / BROWSER
                                           │
                                  http://localhost:3000
                                           │
                                           ↓
                       ┌──────────────────────────────────────┐
                       │     nestly-frontend Container        │
                       │          React + Nginx               │
                       │     (Reverse Proxy /api → backend)   │
                       └──────────────────┬───────────────────┘
                                          │
                                   nestly-network
                                          │
                                          ↓
                       ┌──────────────────────────────────────┐
                       │      nestly-backend Container        │
                       │           Node.js + Express          │
                       └──────────┬─────────────────┬─────────┘
                                  │                 │
                           nestly-network    nestly-network
                                  │                 │
                                  ↓                 ↓
                ┌──────────────────┐               ┌──────────────────┐
                │ nestly-mongodb   │               │ nestly-redis     │
                │ Mongo 7.0 + Vol  │               │ Redis 7.2 Alpine │
                └──────────────────┘               └──────────────────┘
```

---

## 2. Key Architectural Components

### A. Application Frontend Container (`client/Dockerfile`)
- **Base Images**: `node:20-alpine` (Build Stage) -> `nginx:1.25-alpine` (Runtime Stage).
- **Multi-Stage Build**: Compiles React SPA with Vite, emitting minified assets to `/usr/share/nginx/html`.
- **Nginx Configuration (`client/nginx.conf`)**:
  - Serves static SPA files on port `80`.
  - Implements SPA client-side routing fallback (`try_files $uri /index.html`).
  - Reverse proxies `/api/*` to `http://backend:5000/api/*` internally, eliminating client CORS friction and hiding internal port configuration.

### B. Application Backend Container (`server/Dockerfile`)
- **Base Image**: `node:20-alpine` (LTS).
- **Dependencies**: Installs only production dependencies (`npm ci --only=production`).
- **Security**: Runs as non-root user `USER node`.
- **Port**: Exposes `5000`.
- **Health Check**: Queries `http://localhost:5000/health`.

### C. Database Service Container (`mongo:7.0`)
- **Persistence**: Named Docker volume `mongodb_data` mapped to `/data/db`.
- **Health Check**: `mongosh --eval 'db.adminCommand("ping")'`.

### D. Cache Service Container (`redis:7.2-alpine`)
- **Role**: High-speed temporary caching & distributed rate limiting.
- **Persistence**: Ephemeral. If Redis restarts, cache clears and repopulates safely via MongoDB fallback (Phase 11 design).
- **Health Check**: `redis-cli ping`.

---

## 3. Environment Variables & Secrets Policy

> **CRITICAL RULE**: Docker images **NEVER** contain hardcoded production secrets, API keys, or `.env` files. Secret values are injected strictly at runtime via environment variables or Compose files.

| Service | Environment Variable | Default Value | Description |
|---|---|---|---|
| **backend** | `PORT` | `5000` | HTTP port inside container |
| **backend** | `NODE_ENV` | `production` | Node environment |
| **backend** | `MONGODB_URI` | `mongodb://mongodb:27017/nestly` | Internal Compose MongoDB connection string |
| **backend** | `REDIS_URL` | `redis://redis:6379` | Internal Compose Redis connection string |
| **backend** | `JWT_SECRET` | Secret String | JWT cookie signing secret |
| **backend** | `CLIENT_URL` | `http://localhost:3000` | Allowed CORS origin |
| **frontend** | `VITE_API_BASE_URL` | `/api` | Relative API path for Nginx reverse proxy |

---

## 4. Docker Compose Quick-Start

### Prerequisites
- Docker Engine `v24.0+`
- Docker Compose `v2.20+`

### Local Development Orchestration

To build images and launch the full 4-container stack:

```bash
# 1. Clone & navigate to project root
cd Nestly

# 2. Launch container stack
docker compose up -d --build

# 3. Check status & health of containers
docker compose ps
```

Expected output:

```
NAME              IMAGE                   COMMAND                  SERVICE    CREATED          STATUS                    PORTS
nestly-backend    nestly-backend:latest   "docker-entrypoint.s…"   backend    10 seconds ago   Up 8 seconds (healthy)    0.0.0.0:5000->5000/tcp
nestly-frontend   nestly-frontend:latest  "/docker-entrypoint.…"   frontend   10 seconds ago   Up 8 seconds (healthy)    0.0.0.0:3000->80/tcp
nestly-mongodb    mongo:7.0               "docker-entrypoint.s…"   mongodb    10 seconds ago   Up 9 seconds (healthy)    0.0.0.0:27017->27017/tcp
nestly-redis      redis:7.2-alpine        "docker-entrypoint.s…"   redis      10 seconds ago   Up 9 seconds (healthy)    0.0.0.0:6379->6379/tcp
```

### Stopping & Cleaning Up

```bash
# Stop containers while preserving database volume
docker compose down

# Stop containers AND purge database volume
docker compose down -v
```

---

## 5. Service Communication & Networking

Containers communicate across a private bridge network `nestly-network` using Compose service names:

- Backend to MongoDB: `mongodb://mongodb:27017/nestly` (NOT `localhost:27017`)
- Backend to Redis: `redis://redis:6379` (NOT `localhost:6379`)
- Nginx to Backend: `http://backend:5000/api/` (NOT `localhost:5000`)

---

## 6. Verification & Health Check Endpoints

| Endpoint | Target Container | Purpose |
|---|---|---|
| `http://localhost:3000/` | `nestly-frontend` | React SPA home page |
| `http://localhost:3000/health-check` | `nestly-frontend` | Nginx health probe |
| `http://localhost:5000/health` | `nestly-backend` | Express API, Mongo & Redis health metrics |
| `http://localhost:5000/api/cache/metrics` | `nestly-backend` | Redis hit/miss metric telemetry |

---

## 7. Troubleshooting Common Errors

### 1. `Backend cannot connect to MongoDB: ECONNREFUSED 127.0.0.1:27017`
- **Cause**: Inside a Docker container, `127.0.0.1` or `localhost` points to the backend container itself, not the MongoDB container.
- **Solution**: Set `MONGODB_URI=mongodb://mongodb:27017/nestly`.

### 2. `Backend cannot connect to Redis: ECONNREFUSED 127.0.0.1:6379`
- **Cause**: Backend is looking for Redis on container localhost.
- **Solution**: Set `REDIS_URL=redis://redis:6379`.

### 3. `CORS Policy Violation: Origin http://localhost:3000 not allowed`
- **Cause**: Backend CORS whitelist does not include container origin.
- **Solution**: Ensure `CLIENT_URL=http://localhost:3000` is set in `docker-compose.yml`.

### 4. `npm ci fails with Missing: @esbuild/linux-x64`
- **Cause**: Lockfile generated on Windows lacks Linux binary optional dependencies.
- **Solution**: Frontend `Dockerfile` uses `npm install` in build stage to resolve platform dependencies dynamically.
