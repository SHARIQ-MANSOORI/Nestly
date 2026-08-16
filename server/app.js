const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const {
  authLimiter,
  sensitiveApiLimiter,
  publicApiLimiter,
  helmetConfig,
  getCorsOptions,
} = require('./config/security');
const sanitizeNoSqlQueries = require('./middleware/mongoSanitize');
const errorHandler = require('./middleware/errorHandler');
const { connectRedis } = require('./config/redis');

// Initialize Redis Connection
connectRedis();

const hotelRoutes = require('./routes/hotelRoutes');
const roomRoutes = require('./routes/roomRoutes');
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const adminAuditRoutes = require('./routes/adminAuditRoutes');

const app = express();

// 1. Security HTTP Headers via Helmet
app.use(helmet(helmetConfig));

// 2. Enable Cookie Parser
app.use(cookieParser());

// 3. CORS Hardening with Whitelisted Origins
app.use(cors(getCorsOptions()));

// 4. Request Body Size Limits & Raw Body Buffer for Webhooks
app.use(express.json({
  limit: '10kb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ limit: '10kb', extended: true }));

// 5. NoSQL Injection Prevention Middleware (Sanitizes req.body, req.query, req.params)
app.use(sanitizeNoSqlQueries);

// Health Check API (Supports both /health and /api/health)
const handleHealthCheck = (req, res) => {
  const mongoose = require('mongoose');
  const { isRedisConnected } = require('./config/redis');
  const cacheService = require('./services/cacheService');

  const dbHealthy = mongoose.connection && mongoose.connection.readyState === 1;
  const redisHealthy = isRedisConnected();

  let overallStatus = 'ok';
  if (!dbHealthy) {
    overallStatus = 'unhealthy';
  } else if (!redisHealthy) {
    overallStatus = 'degraded';
  }

  const statusCode = dbHealthy ? 200 : 503;

  res.status(statusCode).json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    services: {
      database: dbHealthy ? 'healthy' : 'unhealthy',
      redis: redisHealthy ? 'healthy' : 'unavailable',
    },
    metrics: cacheService.getMetrics(),
  });
};

app.get('/health', handleHealthCheck);
app.get('/api/health', handleHealthCheck);

// Cache Metrics Endpoint
app.get('/api/cache/metrics', (req, res) => {
  const cacheService = require('./services/cacheService');
  res.status(200).json({
    success: true,
    data: cacheService.getMetrics(),
  });
});

// 6. Tiered Rate Limiting & API Route Mounting
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/hotels', publicApiLimiter, hotelRoutes);
app.use('/api/rooms', publicApiLimiter, roomRoutes);
app.use('/api/bookings', sensitiveApiLimiter, bookingRoutes);
app.use('/api/payments', sensitiveApiLimiter, paymentRoutes);
app.use('/api/notifications', sensitiveApiLimiter, notificationRoutes);
app.use('/api/analytics', sensitiveApiLimiter, analyticsRoutes);
app.use('/api/reviews', sensitiveApiLimiter, reviewRoutes);
app.use('/api/admin/audit-logs', sensitiveApiLimiter, adminAuditRoutes);

// 404 Route Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route ${req.originalUrl} not found`,
  });
});

// Global Central Error Handler (Sanitizes stack traces in production)
app.use(errorHandler);

module.exports = app;
