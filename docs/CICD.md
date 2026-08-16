# Nestly CI/CD Pipeline Documentation (Phase 14)

## Overview & Architecture

Nestly uses **GitHub Actions** for automated continuous integration (CI) and build validation. Every pull request and push to primary branches (`main`, `master`, `develop`) triggers automated code quality checks, secret scans, security audits, containerized integration tests, and production build verifications.

```
                  ┌─────────────────────────────────────┐
                  │ Push / Pull Request to main/develop │
                  └──────────────────┬──────────────────┘
                                     │
             ┌───────────────────────┴───────────────────────┐
             ▼                                               ▼
┌───────────────────────────┐                   ┌───────────────────────────┐
│       ci.yml (CI)         │                   │     docker.yml (Build)    │
├───────────────────────────┤                   ├───────────────────────────┤
│ 1. Lint & Secret Scan     │                   │ 1. Setup Buildx           │
│ 2. Unit/Integration Tests │                   │ 2. Build nestly-backend   │
│    (MongoDB 7.0 + Redis)  │                   │ 3. Build nestly-frontend  │
│ 3. Frontend Production    │                   │    (Multi-stage Nginx)    │
│    Vite Build Asset Check │                   └───────────────────────────┘
└───────────────────────────┘
```

---

## Workflow Triggers & Concurrency

Both workflows are configured with automatic concurrency cancellation:
- **Triggers**: `push` and `pull_request` on `main`, `master`, and `develop` branches.
- **Concurrency Control**: `cancel-in-progress: true` automatically cancels older out-of-date workflow runs when a developer pushes new commits to an open pull request.
- **Least Privilege Permissions**: All workflows run with explicit read-only repository permissions (`permissions: { contents: read }`).

---

## Workflow Jobs & Pipeline Stages

### 1. `ci.yml` — Main Continuous Integration Pipeline

#### Job A: `lint-and-security` (Quality & Defense Gate)
- **Node Environment**: Node.js 20 LTS (`node-version: 20.x`) with npm dependency caching (`cache: 'npm'`).
- **Dependencies**: Clean installation using `npm ci` across root, `server/`, and `client/`.
- **Secret Scanning**: Scans source files for unencrypted JWT tokens, AWS access keys, or private credential strings using regex pattern checking.
- **Security Audit**: Runs `npm audit --audit-level=high` to flag vulnerable dependencies.
- **Code Linting**: Executes `npm run lint` (runs `eslint` with `--max-warnings 0` across server and client).

#### Job B: `test` (Containerized Integration & Unit Testing)
- **Service Containers**:
  - **MongoDB 7.0**: `mongo:7.0` container mapping port `27017:27017` with `mongosh` healthcheck.
  - **Redis 7.2**: `redis:7.2-alpine` container mapping port `6379:6379` with `redis-cli ping` healthcheck.
- **Test Environment Variables**:
  - `NODE_ENV`: `test`
  - `MONGODB_URI`: `mongodb://localhost:27017/nestly_test`
  - `REDIS_URL`: `redis://localhost:6379`
  - `JWT_SECRET`: Ephemeral test secret key
- **Coverage Output**: Runs `npm run test:coverage` (Jest unit/integration tests with coverage report) and uploads `server/coverage/` artifact with a 7-day retention period.

#### Job C: `build` (Frontend Production Build Gate)
- Runs `npm run build` inside `client/` using Vite compiler.
- Asserts presence of `client/dist/` directory and compiled `index.html`.

---

### 2. `docker.yml` — Docker Build Validation Pipeline

- **Build Engine**: Uses `docker/setup-buildx-action@v3` for modern Docker BuildKit features.
- **Backend Image Verification**: Builds `nestly-backend` using `server/Dockerfile` (Node 20 Alpine, non-root user `nodejs`, health check).
- **Frontend Image Verification**: Builds `nestly-frontend` using `client/Dockerfile` (Multi-stage Node 20 build + Nginx Alpine static distribution).
- **Security & Scope**: Container images are compiled with `push: false` for strict validation without exposing unverified images to remote registries.

---

## Local CI Reproduction & Developer Guide

Developers can run exact local equivalents of CI steps before opening a pull request:

```bash
# 1. Clean Dependency Installation
npm ci && cd server && npm ci && cd ../client && npm ci && cd ..

# 2. Linting (Zero Warning Enforcement)
npm run lint

# 3. Full Automated Test Suite with Coverage
npm run test:coverage

# 4. Frontend Production Build
npm run build

# 5. Local Docker Container Stack Build
docker compose build
```

---

## Future Deployment Readiness (Phase 15+)

Phase 14 completes all prerequisite CI test and build infrastructure. Phase 15 will hook into `docker.yml` to tag images and push them to **AWS ECR (Elastic Container Registry)** and trigger rolling deployments to **AWS ECS / EC2**.
