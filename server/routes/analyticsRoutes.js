const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const {
  getManagerOverview,
  getAdminOverview,
} = require('../controllers/analyticsController');

// All analytics routes require authentication
router.use(protect);

// Manager Analytics Endpoint
router.get('/manager/overview', authorize('manager', 'admin'), getManagerOverview);

// Admin Platform Analytics Endpoint
router.get('/admin/overview', authorize('admin'), getAdminOverview);

module.exports = router;
