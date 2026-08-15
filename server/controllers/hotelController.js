const Hotel = require('../models/Hotel');
const Room = require('../models/Room');

// Helper function to update hotel startingPrice based on active rooms
const updateHotelStartingPrice = async (hotelId) => {
  const activeRooms = await Room.find({ hotel: hotelId, status: 'available' }).sort({ pricePerNight: 1 });
  let startingPrice = 0;
  if (activeRooms.length > 0) {
    startingPrice = activeRooms[0].pricePerNight;
  }
  await Hotel.findByIdAndUpdate(hotelId, { startingPrice });
  return startingPrice;
};

// @desc    Get public hotels with search, filter, and sort
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
      status,
    } = req.query;

    // By default, public discovery lists active hotels only
    let query = { status: status || 'active' };

    // Filter by city / location
    if (location && location.trim() !== '') {
      query.city = { $regex: new RegExp(location.trim(), 'i') };
    }

    // Keyword Search (Name, City, Location, Description)
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
      sortOptions.rating = -1;
      sortOptions.createdAt = -1;
    }

    const hotels = await Hotel.find(query).sort(sortOptions);
    const cities = await Hotel.distinct('city', { status: 'active' });

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
    const hotel = await Hotel.findById(req.params.id).populate('owner', 'name email profileImage');

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel property not found',
      });
    }

    // Fetch rooms for this hotel
    const roomQuery = { hotel: hotel._id };
    
    // Unless requested by owner/admin, filter active rooms
    const isOwnerOrAdmin = req.user && (req.user.role === 'admin' || hotel.owner._id.toString() === req.user._id.toString());
    if (!isOwnerOrAdmin) {
      roomQuery.status = 'available';
    }

    const rooms = await Room.find(roomQuery);

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

// @desc    Get all hotels owned by authenticated manager
// @route   GET /api/hotels/manager/my-hotels
// @access  Private (Manager / Admin)
const getManagerHotels = async (req, res, next) => {
  try {
    const query = req.user.role === 'admin' ? {} : { owner: req.user._id };
    const hotels = await Hotel.find(query).sort({ createdAt: -1 });

    // Attach room count summary to each hotel
    const hotelsWithSummary = await Promise.all(
      hotels.map(async (hotel) => {
        const roomCount = await Room.countDocuments({ hotel: hotel._id, status: { $ne: 'inactive' } });
        return {
          ...hotel.toObject(),
          roomCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: hotelsWithSummary.length,
      data: hotelsWithSummary,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new hotel property (Manager Only)
// @route   POST /api/hotels
// @access  Private (Manager / Admin)
const createHotel = async (req, res, next) => {
  try {
    const {
      name,
      description,
      location,
      city,
      country,
      addressDetails,
      images,
      amenities,
      status,
    } = req.body;

    if (!name || !description || !location || !city) {
      return res.status(400).json({
        success: false,
        message: 'Please provide hotel name, description, location, and city',
      });
    }

    // Security Rule: Automatically assign owner from authenticated user token
    const hotelData = {
      name: name.trim(),
      description,
      location: location.trim(),
      city: city.trim(),
      country: country ? country.trim() : 'India',
      addressDetails: addressDetails || { address: location, city, country: country || 'India' },
      images: images && images.length > 0 ? images : ['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1000'],
      amenities: amenities || [],
      owner: req.user._id,
      status: status || 'active',
      startingPrice: 0,
    };

    const hotel = await Hotel.create(hotelData);

    res.status(201).json({
      success: true,
      message: 'Hotel property created successfully',
      data: hotel,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update hotel property (Manager Owner / Admin)
// @route   PUT /api/hotels/:id
// @access  Private (Manager Owner / Admin)
const updateHotel = async (req, res, next) => {
  try {
    const {
      name,
      description,
      location,
      city,
      country,
      addressDetails,
      images,
      amenities,
      status,
    } = req.body;

    const fieldsToUpdate = {};
    if (name) fieldsToUpdate.name = name.trim();
    if (description) fieldsToUpdate.description = description;
    if (location) fieldsToUpdate.location = location.trim();
    if (city) fieldsToUpdate.city = city.trim();
    if (country) fieldsToUpdate.country = country.trim();
    if (addressDetails) fieldsToUpdate.addressDetails = addressDetails;
    if (images && images.length > 0) fieldsToUpdate.images = images;
    if (amenities) fieldsToUpdate.amenities = amenities;
    if (status) fieldsToUpdate.status = status;

    const updatedHotel = await Hotel.findByIdAndUpdate(
      req.params.id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    );

    // If status updated to inactive, deactivate associated rooms as well
    if (status === 'inactive') {
      await Room.updateMany({ hotel: updatedHotel._id }, { status: 'inactive' });
    }

    await updateHotelStartingPrice(updatedHotel._id);

    res.status(200).json({
      success: true,
      message: 'Hotel property updated successfully',
      data: updatedHotel,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Soft deactivate hotel property (Manager Owner / Admin)
// @route   DELETE /api/hotels/:id
// @access  Private (Manager Owner / Admin)
const deleteHotel = async (req, res, next) => {
  try {
    const hotel = req.hotel || await Hotel.findById(req.params.id);

    // Soft deactivation strategy
    hotel.status = 'inactive';
    await hotel.save();

    // Soft deactivate associated rooms
    await Room.updateMany({ hotel: hotel._id }, { status: 'inactive' });

    res.status(200).json({
      success: true,
      message: 'Hotel property deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHotels,
  getHotelById,
  getManagerHotels,
  createHotel,
  updateHotel,
  deleteHotel,
  updateHotelStartingPrice,
};
