const jwt = require('jsonwebtoken');

const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'nestly_jwt_secret_dev_key_2026_change_in_production',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = generateToken(user._id, user.role);

  const cookieName = process.env.COOKIE_NAME || 'nestly_token';
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  };

  // Convert mongoose doc to plain JS object if needed and delete password
  const userObject = user.toObject ? user.toObject() : { ...user };
  delete userObject.password;

  res
    .status(statusCode)
    .cookie(cookieName, token, cookieOptions)
    .json({
      success: true,
      message,
      user: userObject,
    });
};

module.exports = {
  generateToken,
  sendTokenResponse,
};
