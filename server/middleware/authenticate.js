const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  const cookieName = process.env.COOKIE_NAME || 'nestly_token';

  // 1. Check HTTP-only cookie first
  if (req.cookies && req.cookies[cookieName]) {
    token = req.cookies[cookieName];
  } 
  // 2. Fallback to Authorization Header
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required to access this resource',
    });
  }

  try {
    // Verify JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'nestly_jwt_secret_dev_key_2026_change_in_production'
    );

    // Fetch user from DB
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists',
      });
    }

    if (user.isActive === false) {
      return res.status(401).json({
        success: false,
        message: 'Your user account has been deactivated. Please contact support.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token',
    });
  }
};

module.exports = { protect };
