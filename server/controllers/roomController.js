const Room = require('../models/Room');
const Hotel = require('../models/Hotel');
const { updateHotelStartingPrice } = require('./hotelController');

// @desc    Get rooms by hotel ID
// @route   GET /api/hotels/:hotelId/rooms
// @access  Public
const getRoomsByHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.findById(req.params.hotelId);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found',
      });
    }

    const query = { hotel: req.params.hotelId };

    // Unless manager owner or admin, filter active rooms
    const isOwnerOrAdmin = req.user && (req.user.role === 'admin' || hotel.owner.toString() === req.user._id.toString());
    if (!isOwnerOrAdmin) {
      query.status = 'available';
    }

    const rooms = await Room.find(query);
    res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single room by ID
// @route   GET /api/rooms/:id
// @access  Public
const getRoomById = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id).populate('hotel', 'name city location startingPrice rating owner status');
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room option not found',
      });
    }

    res.status(200).json({
      success: true,
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create room inside hotel (Manager Owner / Admin)
// @route   POST /api/hotels/:hotelId/rooms
// @access  Private (Manager Owner / Admin)
const createRoom = async (req, res, next) => {
  try {
    const { hotelId } = req.params;
    const {
      name,
      description,
      type,
      pricePerNight,
      capacity,
      amenities,
      images,
      totalRooms,
      status,
    } = req.body;

    if (!name || !description || pricePerNight === undefined || !capacity) {
      return res.status(400).json({
        success: false,
        message: 'Please provide room name, description, price per night, and capacity',
      });
    }

    const roomData = {
      hotel: hotelId,
      name: name.trim(),
      description,
      type: type || 'Deluxe',
      pricePerNight: Number(pricePerNight),
      capacity: Number(capacity),
      totalRooms: totalRooms ? Number(totalRooms) : 10,
      amenities: amenities || [],
      images: images || [],
      status: status || 'available',
    };

    const room = await Room.create(roomData);

    // Auto update starting price of the hotel
    await updateHotelStartingPrice(hotelId);

    res.status(201).json({
      success: true,
      message: 'Room package created successfully',
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update room details (Manager Owner / Admin)
// @route   PUT /api/rooms/:id
// @access  Private (Manager Owner / Admin)
const updateRoom = async (req, res, next) => {
  try {
    const {
      name,
      description,
      type,
      pricePerNight,
      capacity,
      amenities,
      images,
      totalRooms,
      status,
    } = req.body;

    const fieldsToUpdate = {};
    if (name) fieldsToUpdate.name = name.trim();
    if (description) fieldsToUpdate.description = description;
    if (type) fieldsToUpdate.type = type;
    if (pricePerNight !== undefined) fieldsToUpdate.pricePerNight = Number(pricePerNight);
    if (capacity !== undefined) fieldsToUpdate.capacity = Number(capacity);
    if (totalRooms !== undefined) fieldsToUpdate.totalRooms = Number(totalRooms);
    if (amenities) fieldsToUpdate.amenities = amenities;
    if (images) fieldsToUpdate.images = images;
    if (status) fieldsToUpdate.status = status;

    const updatedRoom = await Room.findByIdAndUpdate(
      req.params.id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    );

    // Auto update starting price of associated hotel
    await updateHotelStartingPrice(updatedRoom.hotel);

    res.status(200).json({
      success: true,
      message: 'Room package updated successfully',
      data: updatedRoom,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Soft deactivate room (Manager Owner / Admin)
// @route   DELETE /api/rooms/:id
// @access  Private (Manager Owner / Admin)
const deleteRoom = async (req, res, next) => {
  try {
    const room = req.room || await Room.findById(req.params.id);

    // Soft deactivation strategy
    room.status = 'inactive';
    await room.save();

    // Auto update starting price of associated hotel
    const hotelId = room.hotel._id || room.hotel;
    await updateHotelStartingPrice(hotelId);

    res.status(200).json({
      success: true,
      message: 'Room package deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRoomsByHotel,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
};
