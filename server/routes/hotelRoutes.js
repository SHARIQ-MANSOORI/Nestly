const express = require('express');
const router = express.Router();
const {
  getHotels,
  getHotelById,
  createHotel,
  updateHotel,
  deleteHotel,
} = require('../controllers/hotelController');
const { getRoomsByHotel } = require('../controllers/roomController');

router.route('/')
  .get(getHotels)
  .post(createHotel);

router.route('/:id')
  .get(getHotelById)
  .put(updateHotel)
  .delete(deleteHotel);

router.route('/:hotelId/rooms')
  .get(getRoomsByHotel);

module.exports = router;
