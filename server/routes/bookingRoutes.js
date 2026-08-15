const express = require('express');
const router = express.Router();
const {
  getQuote,
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getManagerBookings,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

// Public Quote Endpoint
router.post('/quote', getQuote);

// Customer Booking History & Manager Bookings
router.get('/my', protect, getMyBookings);
router.get('/manager/all', protect, authorize('manager', 'admin'), getManagerBookings);

// Booking CRUD
router.post('/', protect, createBooking);

router.route('/:id')
  .get(protect, getBookingById);

router.post('/:id/cancel', protect, cancelBooking);

module.exports = router;
