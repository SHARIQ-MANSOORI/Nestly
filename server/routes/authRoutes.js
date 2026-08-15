const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:resetToken', resetPassword);

// Protected user routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

// Role-protected routes (Testing RBAC foundation)
router.get('/manager-area', protect, authorize('manager', 'admin'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the protected Manager Area foundation',
    user: req.user,
  });
});

router.get('/admin-area', protect, authorize('admin'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the protected Admin Area foundation',
    user: req.user,
  });
});

module.exports = router;
