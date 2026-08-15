const Hotel = require('../models/Hotel');
const Room = require('../models/Room');

// Middleware to verify if current authenticated user owns the target hotel
const verifyHotelOwnership = async (req, res, next) => {
  try {
    const hotelId = req.params.id || req.params.hotelId || req.body.hotel;

    if (!hotelId) {
      return res.status(400).json({
        success: false,
        message: 'Hotel ID is required for ownership verification',
      });
    }

    const hotel = await Hotel.findById(hotelId);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel property not found',
      });
    }

    // Admins bypass ownership check
    if (req.user.role === 'admin') {
      req.hotel = hotel;
      return next();
    }

    // Verify hotel ownership
    if (hotel.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to modify this hotel property',
      });
    }

    req.hotel = hotel;
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to verify if current authenticated user owns the hotel containing target room
const verifyRoomOwnership = async (req, res, next) => {
  try {
    const roomId = req.params.id || req.params.roomId;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: 'Room ID is required for ownership verification',
      });
    }

    const room = await Room.findById(roomId).populate('hotel');

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room option not found',
      });
    }

    // Admins bypass ownership check
    if (req.user.role === 'admin') {
      req.room = room;
      return next();
    }

    if (!room.hotel || room.hotel.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to modify rooms for this hotel',
      });
    }

    req.room = room;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  verifyHotelOwnership,
  verifyRoomOwnership,
};
