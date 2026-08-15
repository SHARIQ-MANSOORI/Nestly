const express = require('express');
const router = express.Router();
const {
  getHotels,
  getHotelById,
  getManagerHotels,
  createHotel,
  updateHotel,
  deleteHotel,
} = require('../controllers/hotelController');
const { getRoomsByHotel, createRoom } = require('../controllers/roomController');
const { checkAvailability } = require('../controllers/bookingController');
const { protect } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { verifyHotelOwnership } = require('../middleware/verifyOwnership');

// Manager routes
router.get('/manager/my-hotels', protect, authorize('manager', 'admin'), getManagerHotels);

// Public hotel routes & Manager Creation
router.route('/')
  .get(getHotels)
  .post(protect, authorize('manager', 'admin'), createHotel);

// Availability check endpoint
router.get('/:hotelId/rooms/:roomId/availability', checkAvailability);

// Parametric hotel routes
router.route('/:id')
  .get(getHotelById)
  .put(protect, authorize('manager', 'admin'), verifyHotelOwnership, updateHotel)
  .delete(protect, authorize('manager', 'admin'), verifyHotelOwnership, deleteHotel);

// Room creation under owned hotel
router.route('/:hotelId/rooms')
  .get(getRoomsByHotel)
  .post(protect, authorize('manager', 'admin'), verifyHotelOwnership, createRoom);

module.exports = router;
