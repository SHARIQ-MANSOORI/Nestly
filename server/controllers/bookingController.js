const crypto = require('crypto');
const Booking = require('../models/Booking');
const Hotel = require('../models/Hotel');
const Room = require('../models/Room');
const { checkRoomAvailability } = require('../services/availabilityService');
const { calculateBookingPrice, normalizeDate } = require('../services/pricingService');
const notificationService = require('../services/notificationService');

// In-Memory Async Lock per Room to eliminate read-then-write race conditions
const roomLocks = new Map();

const acquireRoomLock = async (roomId, fn) => {
  const key = roomId.toString();
  const previousLock = roomLocks.get(key) || Promise.resolve();
  let release;
  const currentLock = new Promise((resolve) => { release = resolve; });
  roomLocks.set(key, previousLock.then(() => currentLock));

  try {
    await previousLock;
    return await fn();
  } finally {
    release();
  }
};

// Helper to generate human-readable unique booking reference
const generateBookingReference = () => {
  const year = new Date().getFullYear();
  const randomChars = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `NST-${year}-${randomChars}`;
};

// @desc    Check room availability for date range
// @route   GET /api/hotels/:hotelId/rooms/:roomId/availability
// @access  Public
const checkAvailability = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { checkIn, checkOut, rooms = 1, guests = 1 } = req.query;

    if (!checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: 'Please provide check-in and check-out dates',
      });
    }

    const availability = await checkRoomAvailability(roomId, checkIn, checkOut, rooms);

    if (!availability.room) {
      return res.status(404).json({
        success: false,
        message: availability.reason || 'Room option not found',
      });
    }

    // Guest capacity check
    const maxCapacity = availability.room.capacity * Number(rooms);
    const capacityValid = Number(guests) <= maxCapacity;

    // Price calculation
    const pricing = calculateBookingPrice(
      availability.room.pricePerNight,
      checkIn,
      checkOut,
      rooms
    );

    res.status(200).json({
      success: true,
      data: {
        available: availability.available && capacityValid,
        availableUnits: availability.availableUnits,
        totalRooms: availability.totalRooms,
        requestedRooms: Number(rooms),
        capacityValid,
        maxCapacityAllowed: maxCapacity,
        pricing,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get booking price quote
// @route   POST /api/bookings/quote
// @access  Public
const getQuote = async (req, res, next) => {
  try {
    const { roomId, checkIn, checkOut, roomsBooked = 1, guests = 1 } = req.body;

    if (!roomId || !checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: 'Please provide room ID, check-in date, and check-out date',
      });
    }

    const room = await Room.findById(roomId);
    if (!room || room.status !== 'available') {
      return res.status(404).json({
        success: false,
        message: 'Room option not available',
      });
    }

    const availability = await checkRoomAvailability(roomId, checkIn, checkOut, roomsBooked);
    const maxCapacity = room.capacity * Number(roomsBooked);
    const capacityValid = Number(guests) <= maxCapacity;

    const pricing = calculateBookingPrice(room.pricePerNight, checkIn, checkOut, roomsBooked);

    res.status(200).json({
      success: true,
      data: {
        available: availability.available && capacityValid,
        availableUnits: availability.availableUnits,
        pricing,
        capacityValid,
        maxCapacityAllowed: maxCapacity,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new booking with concurrency lock & double-booking prevention
// @route   POST /api/bookings
// @access  Private (Customer / Manager / Admin)
const createBooking = async (req, res, next) => {
  const {
    hotelId,
    roomId,
    checkIn: checkInInput,
    checkOut: checkOutInput,
    roomsBooked = 1,
    guests = 1,
  } = req.body;

  if (!hotelId || !roomId || !checkInInput || !checkOutInput) {
    return res.status(400).json({
      success: false,
      message: 'Please provide hotel ID, room ID, check-in date, and check-out date',
    });
  }

  // Acquire concurrency lock per room to guarantee serial availability evaluation
  await acquireRoomLock(roomId, async () => {
    try {
      const checkIn = normalizeDate(checkInInput);
      const checkOut = normalizeDate(checkOutInput);
      const today = normalizeDate(new Date());

      if (checkIn < today) {
        return res.status(400).json({
          success: false,
          message: 'Check-in date cannot be in the past',
        });
      }

      if (checkOut <= checkIn) {
        return res.status(400).json({
          success: false,
          message: 'Check-out date must be after check-in date',
        });
      }

      // Verify Hotel is active
      const hotel = await Hotel.findById(hotelId);
      if (!hotel || hotel.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'This hotel property is currently inactive and cannot accept bookings',
        });
      }

      // Verify Room belongs to hotel and is available
      const room = await Room.findById(roomId);
      if (!room || room.hotel.toString() !== hotelId || room.status !== 'available') {
        return res.status(400).json({
          success: false,
          message: 'Selected room option is not available for this hotel',
        });
      }

      // Capacity check
      const maxCapacity = room.capacity * Number(roomsBooked);
      if (Number(guests) > maxCapacity) {
        return res.status(400).json({
          success: false,
          message: `Guest capacity exceeded. ${roomsBooked} room(s) can accommodate up to ${maxCapacity} guests`,
        });
      }

      // Recheck availability atomically inside mutex lock
      const availability = await checkRoomAvailability(roomId, checkIn, checkOut, roomsBooked);

      if (!availability.available) {
        return res.status(409).json({
          success: false,
          message: 'This room option was just reserved by another guest for your selected dates. Please choose different dates or rooms.',
        });
      }

      // Calculate backend price snapshot
      const pricing = calculateBookingPrice(room.pricePerNight, checkIn, checkOut, roomsBooked);

      // Generate unique booking reference
      const bookingReference = generateBookingReference();

      const bookingData = {
        bookingReference,
        user: req.user._id,
        hotel: hotel._id,
        room: room._id,
        checkIn: pricing.checkIn,
        checkOut: pricing.checkOut,
        guests: Number(guests),
        roomsBooked: pricing.roomsBooked,
        pricePerNight: pricing.pricePerNight,
        numberOfNights: pricing.numberOfNights,
        subtotal: pricing.subtotal,
        taxes: pricing.taxes,
        discount: pricing.discount,
        totalAmount: pricing.totalAmount,
        currency: 'INR',
        status: 'confirmed',
        paymentStatus: 'unpaid',
      };

      const booking = await Booking.create(bookingData);

      const populatedBooking = await Booking.findById(booking._id)
        .populate('hotel', 'name city location images owner')
        .populate('room', 'name type capacity pricePerNight');

      // Await notification event dispatches so database records exist synchronously
      await notificationService.dispatchNotificationEvent('BOOKING_CONFIRMED', {
        userId: req.user._id,
        bookingId: booking._id,
        bookingReference,
        hotelName: hotel.name,
        cityName: hotel.city,
        roomName: room.name,
        userName: req.user.name,
        checkIn: pricing.checkIn,
        checkOut: pricing.checkOut,
        totalAmount: pricing.totalAmount,
      });

      if (hotel.owner) {
        await notificationService.dispatchNotificationEvent('MANAGER_NEW_BOOKING', {
          recipientId: hotel.owner,
          bookingId: booking._id,
          bookingReference,
          hotelName: hotel.name,
          customerName: req.user.name,
          customerEmail: req.user.email,
          roomName: room.name,
          checkIn: pricing.checkIn,
          checkOut: pricing.checkOut,
          totalAmount: pricing.totalAmount,
        });
      }

      res.status(201).json({
        success: true,
        message: 'Reservation created successfully!',
        data: populatedBooking,
      });
    } catch (error) {
      next(error);
    }
  });
};

// @desc    Get authenticated customer's booking history
// @route   GET /api/bookings/my
// @access  Private (Customer)
const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('hotel', 'name city location images status')
      .populate('room', 'name type capacity pricePerNight')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single booking receipt details
// @route   GET /api/bookings/:id
// @access  Private (Booking Customer / Manager Owner / Admin)
const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email profileImage')
      .populate('hotel', 'name city location addressDetails owner images')
      .populate('room', 'name type capacity pricePerNight amenities');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking record not found',
      });
    }

    // Ownership check: Customer who booked OR Manager who owns hotel OR Admin
    const isCustomer = booking.user._id.toString() === req.user._id.toString();
    const isManagerOwner = booking.hotel.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isManagerOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to view this booking record',
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel an existing booking (Customer / Admin)
// @route   POST /api/bookings/:id/cancel
// @access  Private (Booking Customer / Admin)
const cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking record not found',
      });
    }

    // Verify ownership
    const isCustomer = booking.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to cancel this booking',
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This booking is already cancelled',
      });
    }

    // Validate Check-in Date rule
    const today = normalizeDate(new Date());
    const checkIn = normalizeDate(booking.checkIn);

    if (checkIn < today) {
      return res.status(400).json({
        success: false,
        message: 'Reservations cannot be cancelled after the check-in date has passed',
      });
    }

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancellationReason = req.body.cancellationReason || 'Cancelled by customer';

    await booking.save();

    const populated = await Booking.findById(booking._id).populate('hotel', 'name owner').populate('user', 'name');

    // Await cancellation notification dispatches
    await notificationService.dispatchNotificationEvent('BOOKING_CANCELLED', {
      userId: booking.user,
      bookingId: booking._id,
      bookingReference: booking.bookingReference,
      hotelName: populated.hotel?.name || 'Hotel',
      userName: populated.user?.name || 'Guest',
    });

    if (populated.hotel?.owner) {
      await notificationService.dispatchNotificationEvent('MANAGER_BOOKING_CANCELLED', {
        recipientId: populated.hotel.owner,
        bookingId: booking._id,
        bookingReference: booking.bookingReference,
        hotelName: populated.hotel.name,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Reservation cancelled successfully. Inventory has been released.',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get bookings for properties owned by manager
// @route   GET /api/manager/bookings
// @access  Private (Manager / Admin)
const getManagerBookings = async (req, res, next) => {
  try {
    // Find hotels owned by manager
    const managerHotels = await Hotel.find({ owner: req.user._id }).select('_id');
    const hotelIds = managerHotels.map(h => h._id);

    const bookings = await Booking.find({ hotel: { $in: hotelIds } })
      .populate('user', 'name email profileImage')
      .populate('hotel', 'name city location')
      .populate('room', 'name type pricePerNight')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkAvailability,
  getQuote,
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getManagerBookings,
};
