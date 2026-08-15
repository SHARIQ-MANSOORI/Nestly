const mongoSanitize = require('express-mongo-sanitize');

// Custom wrapped MongoDB NoSQL Operator Sanitizer Middleware
const sanitizeNoSqlQueries = (req, res, next) => {
  if (req.body) {
    mongoSanitize.sanitize(req.body, { replaceWith: '_' });
  }
  if (req.query) {
    mongoSanitize.sanitize(req.query, { replaceWith: '_' });
  }
  if (req.params) {
    mongoSanitize.sanitize(req.params, { replaceWith: '_' });
  }
  next();
};

module.exports = sanitizeNoSqlQueries;
