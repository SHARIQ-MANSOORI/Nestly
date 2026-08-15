const auditService = require('../services/auditService');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  let message = err.message || 'Internal Server Error';

  // Log internal error trace silently on server for DevSecOps investigations
  if (statusCode === 500) {
    console.error(`[SYSTEM ERROR 500] ${req.method} ${req.originalUrl}:`, err.stack || err);
    
    // Log Audit Event for system failures
    auditService.logEvent({
      actor: req.user?._id || 'anonymous',
      action: 'SYSTEM_ERROR_500',
      resourceType: 'System',
      resourceId: req.originalUrl,
      status: 'failed',
      req,
      metadata: { error: err.message, stack: err.stack },
    });
  }

  // Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found';
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(val => val.message).join(', ');
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value entered. Record already exists.';
  }

  // Production Error Response (Never expose stack traces or internal query schemas in production)
  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'An internal server error occurred. Please contact support.'
      : message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
