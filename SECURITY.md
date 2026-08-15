# Nestly — Production Security Architecture & Security Policy (`SECURITY.md`)

This document outlines Nestly's defense-in-depth security architecture, risk management controls, secret rotation procedures, and security incident response plan.

---

## 1. Security Architecture & Threat Model

Nestly implements a layered **defense-in-depth** model where no single protection mechanism is assumed to be bulletproof.

```text
                    INTERNET
                       │
                       ▼
            ┌─────────────────────┐
            │ Tiered Rate Limiter │ (express-rate-limit)
            └──────────┬──────────┘
                       ↓
            ┌─────────────────────┐
            │ CORS & Helmet CSP   │ (Security HTTP Headers)
            └──────────┬──────────┘
                       ↓
            ┌─────────────────────┐
            │ NoSQL Sanitization  │ (express-mongo-sanitize)
            └──────────┬──────────┘
                       ↓
            ┌─────────────────────┐
            │ Body Size Limiter   │ (10kb JSON limit)
            └──────────┬──────────┘
                       ↓
            ┌─────────────────────┐
            │ JWT Authentication  │ (HttpOnly Cookie / Bearer)
            └──────────┬──────────┘
                       ↓
            ┌─────────────────────┐
            │ RBAC & IDOR Guards  │ (Ownership & Role checks)
            └──────────┬──────────┘
                       ↓
            ┌─────────────────────┐
            │ Business Services   │ (Authoritative Server Pricing)
            └──────────┬──────────┘
                       ↓
            ┌─────────────────────┐
            │ MongoDB Database    │
            └─────────────────────┘
```

---

## 2. Security Controls Matrix

| Security Area | Implemented Security Control | Location / File |
| :--- | :--- | :--- |
| **Authentication** | Password hashing via `bcryptjs` (salt rounds 10), HTTP-only JWT cookies (`SameSite: Lax/None`, `HttpOnly`), password masking (`select: false`). | [User.js](file:///c:/Users/shari/OneDrive/Desktop/Nestly/server/models/User.js), [generateToken.js](file:///c:/Users/shari/OneDrive/Desktop/Nestly/server/utils/generateToken.js) |
| **Password Policy** | Minimum 8 characters required; common weak passwords (`123456`, `password`, `qwerty`, `admin123`) rejected server-side. | [authController.js](file:///c:/Users/shari/OneDrive/Desktop/Nestly/server/controllers/authController.js) |
| **Authorization (IDOR)** | Server-side ownership verification (`booking.user === req.user._id`, `hotel.owner === req.user._id`, `req.user.role === 'admin'`). | [verifyOwnership.js](file:///c:/Users/shari/OneDrive/Desktop/Nestly/server/middleware/verifyOwnership.js), Controllers |
| **NoSQL Injection** | Recursive stripping of `$` and `.` operators from `req.body`, `req.query`, and `req.params`. Validates Mongoose ObjectIds. | [mongoSanitize.js](file:///c:/Users/shari/OneDrive/Desktop/Nestly/server/middleware/mongoSanitize.js), [validateRequest.js](file:///c:/Users/shari/OneDrive/Desktop/Nestly/server/middleware/validateRequest.js) |
| **XSS Prevention** | User-generated content (review text, hotel descriptions, manager responses) sanitized with `xss` library before persistence. | [reviewService.js](file:///c:/Users/shari/OneDrive/Desktop/Nestly/server/services/reviewService.js), [hotelController.js](file:///c:/Users/shari/OneDrive/Desktop/Nestly/server/controllers/hotelController.js) |
| **Rate Limiting** | Tiered rate limiting: Auth endpoints (15 req/15 min), Sensitive transaction APIs (60 req/15 min), Public APIs (300 req/15 min). | [security.js](file:///c:/Users/shari/OneDrive/Desktop/Nestly/server/config/security.js) |
| **HTTP Security Headers** | Helmet CSP restricting script origins to Razorpay (`checkout.razorpay.com`), disabling iframe embedding except for checkout. | [app.js](file:///c:/Users/shari/OneDrive/Desktop/Nestly/server/app.js) |
| **CORS Whitelisting** | Environment-configured origins in `CLIENT_URL`, credential support enabled, wildcards rejected. | [security.js](file:///c:/Users/shari/OneDrive/Desktop/Nestly/server/config/security.js) |
| **Payment Security** | Server-side amount calculation authority in paise/subunits, HMAC-SHA256 signature verification, idempotent orders. | [paymentService.js](file:///c:/Users/shari/OneDrive/Desktop/Nestly/server/services/paymentService.js), [razorpayProvider.js](file:///c:/Users/shari/OneDrive/Desktop/Nestly/server/services/providers/razorpayProvider.js) |
| **Webhook Security** | HMAC signature validation over raw body buffer (`req.rawBody`) before processing events. | [paymentController.js](file:///c:/Users/shari/OneDrive/Desktop/Nestly/server/controllers/paymentController.js) |
| **Audit Logging** | Centralized `AuditLog` model recording login failures, role escalation attempts, hotel modifications, payments, and moderation. | [AuditLog.js](file:///c:/Users/shari/OneDrive/Desktop/Nestly/server/models/AuditLog.js), [auditService.js](file:///c:/Users/shari/OneDrive/Desktop/Nestly/server/services/auditService.js) |
| **Error Handling** | Production error handler suppresses internal stack traces (`NODE_ENV === 'production'`) and returns safe generic messages. | [errorHandler.js](file:///c:/Users/shari/OneDrive/Desktop/Nestly/server/middleware/errorHandler.js) |

---

## 3. Secret Rotation Procedures

In the event of credential expiration or compromise:

1. **JWT Secret Rotation**:
   - Update `JWT_SECRET` in environment variables.
   - Existing user sessions will expire cleanly and prompt re-authentication.

2. **Database Credentials Rotation**:
   - Update `MONGODB_URI` connection string in environment variables.
   - Restart the server process.

3. **Payment Gateway Secret Rotation**:
   - Generate new API key and webhook secret in Razorpay Dashboard.
   - Update `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` in environment variables.

---

## 4. Security Incident Response Protocol

If a security event or unauthorized access attempt is detected:

1. **Identify & Contain**: Check Admin Audit Logs (`/api/admin/audit-logs`) to identify affected user accounts, IP addresses, or resource IDs.
2. **Account Containment**: Deactivate compromised accounts (`User.isActive = false`).
3. **Secret Revocation**: Rotate affected environment secrets immediately.
4. **Log Review & Post-Mortem**: Inspect audit log metadata to trace root cause and document corrective DevSecOps actions.
