const mongoose = require('mongoose');
const Review = require('../models/Review');
const Hotel = require('../models/Hotel');

const ratingService = {
  /**
   * Recalculates average rating, review count, 5-star distribution, and category averages for a hotel
   */
  recalculateHotelRating: async (hotelId) => {
    const hotelObjectId = new mongoose.Types.ObjectId(hotelId);

    const stats = await Review.aggregate([
      {
        $match: {
          hotel: hotelObjectId,
          status: 'published',
        },
      },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
          star1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
          star2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
          star3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
          star4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
          star5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
          avgCleanliness: { $avg: '$categories.cleanliness' },
          avgLocation: { $avg: '$categories.location' },
          avgService: { $avg: '$categories.service' },
          avgValue: { $avg: '$categories.value' },
        },
      },
    ]);

    let rating = 0;
    let reviewCount = 0;
    let ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let categoryRatings = { cleanliness: 0, location: 0, service: 0, value: 0 };

    if (stats.length > 0) {
      const res = stats[0];
      reviewCount = res.reviewCount;
      rating = Number(res.avgRating.toFixed(1));
      ratingBreakdown = {
        1: res.star1 || 0,
        2: res.star2 || 0,
        3: res.star3 || 0,
        4: res.star4 || 0,
        5: res.star5 || 0,
      };
      categoryRatings = {
        cleanliness: res.avgCleanliness ? Number(res.avgCleanliness.toFixed(1)) : 0,
        location: res.avgLocation ? Number(res.avgLocation.toFixed(1)) : 0,
        service: res.avgService ? Number(res.avgService.toFixed(1)) : 0,
        value: res.avgValue ? Number(res.avgValue.toFixed(1)) : 0,
      };
    }

    await Hotel.findByIdAndUpdate(hotelId, {
      rating,
      averageRating: rating,
      reviewCount,
      ratingBreakdown,
      categoryRatings,
    });

    return {
      rating,
      averageRating: rating,
      reviewCount,
      ratingBreakdown,
      categoryRatings,
    };
  },
};

module.exports = ratingService;
