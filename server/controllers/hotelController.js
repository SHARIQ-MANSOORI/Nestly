const Hotel = require('../models/Hotel');
const Room = require('../models/Room');

// @desc    Get all hotels with search, filter, and sort
// @route   GET /api/hotels
// @access  Public
const getHotels = async (req, res, next) => {
  try {
    const {
      location,
      search,
      minPrice,
      maxPrice,
      minRating,
      sort,
    } = req.query;

    let query = {};

    // Filter by city / location
    if (location && location.trim() !== '') {
      query.city = { $regex: new RegExp(location.trim(), 'i') };
    }

    // Keyword Search (Name, City, Location)
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { city: searchRegex },
        { location: searchRegex },
        { description: searchRegex }
      ];
    }

    // Price Filtering
    if (minPrice || maxPrice) {
      query.startingPrice = {};
      if (minPrice) query.startingPrice.$gte = Number(minPrice);
      if (maxPrice) query.startingPrice.$lte = Number(maxPrice);
    }

    // Rating Filtering
    if (minRating) {
      query.rating = { $gte: Number(minRating) };
    }

    // Sorting
    let sortOptions = {};
    if (sort === 'price_asc') {
      sortOptions.startingPrice = 1;
    } else if (sort === 'price_desc') {
      sortOptions.startingPrice = -1;
    } else if (sort === 'rating_desc') {
      sortOptions.rating = -1;
    } else if (sort === 'newest') {
      sortOptions.createdAt = -1;
    } else {
      // Default sort by rating descending then createdAt
      sortOptions.rating = -1;
      sortOptions.createdAt = -1;
    }

    const hotels = await Hotel.find(query).sort(sortOptions);

    // Get list of distinct cities for frontend filters
    const cities = await Hotel.distinct('city');

    res.status(200).json({
      success: true,
      count: hotels.length,
      cities,
      data: hotels,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single hotel by ID with rooms
// @route   GET /api/hotels/:id
// @access  Public
const getHotelById = async (req, res, next) => {
  try {
    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found',
      });
    }

    const rooms = await Room.find({ hotel: hotel._id });

    res.status(200).json({
      success: true,
      data: {
        ...hotel.toObject(),
        rooms,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new hotel (Dev / Seed endpoint)
// @route   POST /api/hotels
// @access  Public (Foundation)
const createHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.create(req.body);
    res.status(201).json({
      success: true,
      data: hotel,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update hotel (Dev / Foundation endpoint)
// @route   PUT /api/hotels/:id
// @access  Public (Foundation)
const updateHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found',
      });
    }

    res.status(200).json({
      success: true,
      data: hotel,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete hotel (Dev / Foundation endpoint)
// @route   DELETE /api/hotels/:id
// @access  Public (Foundation)
const deleteHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.findByIdAndDelete(req.params.id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found',
      });
    }

    await Room.deleteMany({ hotel: hotel._id });

    res.status(200).json({
      success: true,
      message: 'Hotel and associated rooms removed',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHotels,
  getHotelById,
  createHotel,
  updateHotel,
  deleteHotel,
};
