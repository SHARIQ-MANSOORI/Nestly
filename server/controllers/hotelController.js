const xss = require('xss');
const Hotel = require('../models/Hotel');
const Room = require('../models/Room');
const auditService = require('../services/auditService');
const cacheService = require('../services/cacheService');

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

    const cacheKey = cacheService.generateKey.search(req.query);

    const cachedData = await cacheService.getOrSet(cacheKey, 180, async () => {
      // By default, public discovery lists active hotels only
      let query = { status: status || 'active' };

      // Filter by city / location (Safely escaped regex)
      if (location && location.trim() !== '') {
        const sanitizedLocation = xss(location.trim());
        query.city = { $regex: new RegExp(sanitizedLocation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') };
      }

      // Keyword Search (Name, City, Location, Description)
      if (search && search.trim() !== '') {
        const sanitizedSearch = xss(search.trim());
        const escapedSearch = sanitizedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchRegex = new RegExp(escapedSearch, 'i');
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
        if (minPrice && !isNaN(Number(minPrice))) query.startingPrice.$gte = Number(minPrice);
        if (maxPrice && !isNaN(Number(maxPrice))) query.startingPrice.$lte = Number(maxPrice);
      }

      // Rating Filtering
      if (minRating && !isNaN(Number(minRating))) {
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

      return { hotels, cities };
    });

    res.status(200).json({
      success: true,
      count: cachedData.hotels.length,
      cities: cachedData.cities,
      data: cachedData.hotels,
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
    const hotelId = req.params.id;

    // Check if user is owner/admin (requires live data)
    let isOwnerOrAdmin = false;
    if (req.user) {
      if (req.user.role === 'admin') {
        isOwnerOrAdmin = true;
      } else {
        const rawHotel = await Hotel.findById(hotelId);
        if (rawHotel && rawHotel.owner.toString() === req.user._id.toString()) {
          isOwnerOrAdmin = true;
        }
      }
    }

    if (isOwnerOrAdmin) {
      const hotel = await Hotel.findById(hotelId).populate('owner', 'name email profileImage');
      if (!hotel) {
        return res.status(404).json({ success: false, message: 'Hotel property not found' });
      }
      const rooms = await Room.find({ hotel: hotel._id });
      return res.status(200).json({ success: true, data: { ...hotel.toObject(), rooms } });
    }

    // Public cached hotel details
    const cacheKey = cacheService.generateKey.hotel(hotelId);
    const cachedData = await cacheService.getOrSet(cacheKey, 600, async () => {
      const hotel = await Hotel.findById(hotelId).populate('owner', 'name email profileImage');
      if (!hotel) return null;

      const rooms = await Room.find({ hotel: hotel._id, status: 'available' });
      return { ...hotel.toObject(), rooms };
    });

    if (!cachedData) {
      return res.status(404).json({
        success: false,
        message: 'Hotel property not found',
      });
    }

    res.status(200).json({
      success: true,
      data: cachedData,
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

// @desc    Create new hotel property (Manager Only, XSS Sanitized)
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

    // Security Rule: Automatically assign owner from authenticated user token and XSS sanitize input
    const sanitizedAmenities = Array.isArray(amenities)
      ? amenities.map(a => xss(String(a).trim()))
      : [];

    const hotelData = {
      name: xss(name.trim()),
      description: xss(description.trim()),
      location: xss(location.trim()),
      city: xss(city.trim()),
      country: country ? xss(country.trim()) : 'India',
      addressDetails: addressDetails || { address: xss(location), city: xss(city), country: country ? xss(country) : 'India' },
      images: images && images.length > 0 ? images : ['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1000'],
      amenities: sanitizedAmenities,
      owner: req.user._id,
      status: status || 'active',
      startingPrice: 0,
    };

    const hotel = await Hotel.create(hotelData);

    // Invalidate search caches
    await cacheService.deleteMany('nestly:v1:search:*');

    await auditService.logEvent({
      actor: req.user._id,
      action: 'HOTEL_CREATED',
      resourceType: 'Hotel',
      resourceId: hotel._id,
      status: 'success',
      req,
      metadata: { hotelName: hotel.name, city: hotel.city },
    });

    res.status(201).json({
      success: true,
      message: 'Hotel property created successfully',
      data: hotel,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update hotel property (Manager Owner / Admin, XSS Sanitized)
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
    if (name) fieldsToUpdate.name = xss(name.trim());
    if (description) fieldsToUpdate.description = xss(description.trim());
    if (location) fieldsToUpdate.location = xss(location.trim());
    if (city) fieldsToUpdate.city = xss(city.trim());
    if (country) fieldsToUpdate.country = xss(country.trim());
    if (addressDetails) fieldsToUpdate.addressDetails = addressDetails;
    if (images && images.length > 0) fieldsToUpdate.images = images;
    if (amenities && Array.isArray(amenities)) fieldsToUpdate.amenities = amenities.map(a => xss(String(a).trim()));
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

    // Invalidate hotel and search caches
    await cacheService.invalidateHotelCache(updatedHotel._id);

    await auditService.logEvent({
      actor: req.user._id,
      action: 'HOTEL_UPDATED',
      resourceType: 'Hotel',
      resourceId: updatedHotel._id,
      status: 'success',
      req,
    });

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

    await updateHotelStartingPrice(hotel._id);

    // Invalidate hotel and search caches
    await cacheService.invalidateHotelCache(hotel._id);

    await auditService.logEvent({
      actor: req.user._id,
      action: 'HOTEL_DELETED',
      resourceType: 'Hotel',
      resourceId: hotel._id,
      status: 'success',
      req,
    });

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
