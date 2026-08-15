const Room = require('../models/Room');
const Booking = require('../models/Booking');
const { normalizeDate } = require('./pricingService');

const checkRoomAvailability = async (roomId, checkInInput, checkOutInput, roomsRequested = 1, session = null) => {
  const checkIn = normalizeDate(checkInInput);
  const checkOut = normalizeDate(checkOutInput);

  const room = await Room.findById(roomId).session(session);
  if (!room || room.status !== 'available') {
    return {
      available: false,
      availableUnits: 0,
      reason: 'Room option is currently inactive or under maintenance',
      room: null,
    };
  }

  // Overlap Condition: (existingCheckIn < requestedCheckOut) AND (existingCheckOut > requestedCheckIn)
  const overlapQuery = {
    room: roomId,
    status: { $in: ['confirmed', 'pending'] },
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
  };

  const queryBuilder = Booking.find(overlapQuery);
  if (session) {
    queryBuilder.session(session);
  }

  const overlappingBookings = await queryBuilder;
  const bookedUnits = overlappingBookings.reduce((sum, b) => sum + (b.roomsBooked || 1), 0);
  const totalUnits = room.totalRooms || 10;
  const availableUnits = Math.max(0, totalUnits - bookedUnits);

  const requestedCount = Math.max(1, Number(roomsRequested) || 1);
  const isAvailable = availableUnits >= requestedCount;

  return {
    available: isAvailable,
    availableUnits,
    bookedUnits,
    totalRooms: totalUnits,
    requestedRooms: requestedCount,
    room,
  };
};

module.exports = {
  checkRoomAvailability,
};
