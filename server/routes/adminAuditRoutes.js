const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { getAuditLogs } = require('../controllers/adminAuditController');

// Protected Admin Audit Log Route
router.get('/', protect, authorize('admin'), getAuditLogs);

module.exports = router;
