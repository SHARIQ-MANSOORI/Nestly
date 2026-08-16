const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { getRedisClient, isRedisConnected } = require('./redis');

// Helper to create rate limiter store dynamically
const getRateLimitStore = (prefix) => {
  if (isRedisConnected()) {
    try {
      const client = getRedisClient();
      if (client) {
        return new RedisStore({
          // @ts-ignore
          sendCommand: (...args) => client.call(...args),
          prefix: `nestly:rl:${prefix}:`,
        });
      }
    } catch (e) {
      console.warn(`[RateLimit] Failed to initialize RedisStore for ${prefix}, falling back to memory store.`);
    }
  }
  return undefined; // default memory store
};

// 1. Auth Rate Limiter (Brute-force protection for login, register, password reset)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 1000 : 100, // High limit during automated dev/test runs
  standardHeaders: true,
  legacyHeaders: false,
  store: getRateLimitStore('auth'),
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  },
});

// 2. Sensitive API Rate Limiter (Payments, Reviews, Password changes)
const sensitiveApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 1000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  store: getRateLimitStore('sensitive'),
  message: {
    success: false,
    message: 'Too many sensitive transactions requested. Please try again later.',
  },
});

// 3. Public API Rate Limiter (Browsing hotels, searching)
const publicApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 1000 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  store: getRateLimitStore('public'),
  message: {
    success: false,
    message: 'API rate limit exceeded. Please try again shortly.',
  },
});

// 4. Helmet Security Options (CSP & Security Headers)
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        'https://checkout.razorpay.com',
        'https://api.razorpay.com',
      ],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: [
        "'self'",
        'data:',
        'blob:',
        'https://images.unsplash.com',
        'https://res.cloudinary.com',
      ],
      frameSrc: ["'self'", 'https://api.razorpay.com', 'https://checkout.razorpay.com'],
      connectSrc: [
        "'self'",
        'http://localhost:5000',
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:80',
        'http://localhost',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1',
        'https://lumberjack.razorpay.com',
        'https://api.razorpay.com',
      ],
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  referrerPolicy: { policy: 'no-referrer-when-downgrade' },
};

// 5. CORS Options
const getCorsOptions = () => {
  const allowedOrigins = [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:80',
    'http://localhost',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1',
  ];

  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS Policy Violation: Origin ${origin} not allowed`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Razorpay-Signature'],
  };
};

module.exports = {
  authLimiter,
  sensitiveApiLimiter,
  publicApiLimiter,
  helmetConfig,
  getCorsOptions,
};
