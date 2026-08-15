const express = require('express');
const router = express.Router();
const {
  createPaymentOrder,
  verifyPayment,
  handleWebhook,
  getMyPayments,
  getPaymentById,
  getManagerPayments,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

// Webhook listener (Public, verified via header signature)
router.post('/webhook', handleWebhook);

// Customer endpoints
router.post('/create-order', protect, createPaymentOrder);
router.post('/verify', protect, verifyPayment);
router.get('/my', protect, getMyPayments);

// Manager endpoint
router.get('/manager/all', protect, authorize('manager', 'admin'), getManagerPayments);

// Parametric payment detail route
router.get('/:id', protect, getPaymentById);

module.exports = router;
