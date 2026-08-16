const xss = require('xss');
const Review = require('../models/Review');
const ReviewReport = require('../models/ReviewReport');
const Hotel = require('../models/Hotel');
const reviewEligibilityService = require('./reviewEligibilityService');
const ratingService = require('./ratingService');
const notificationService = require('./notificationService');
const auditService = require('./auditService');
const cacheService = require('./cacheService');

const reviewService = {
  // Create verified stay review (XSS Sanitized)
  createReview: async (userId, bookingId, rating, title, comment, categories = {}) => {
    // 1. Verify eligibility
    const eligibility = await reviewEligibilityService.checkReviewEligibility(bookingId, userId);
    if (!eligibility.eligible) {
      const err = new Error(
        eligibility.reason === 'ALREADY_REVIEWED'
          ? 'You have already submitted a review for this stay'
          : eligibility.reason === 'CHECKOUT_NOT_REACHED'
          ? 'Reviews can only be submitted after your stay check-out is complete'
          : eligibility.reason === 'CANCELLED_BOOKING'
          ? 'Cancelled reservations cannot be reviewed'
          : 'You are not eligible to review this booking'
      );
      err.statusCode = 400;
      throw err;
    }

    const booking = eligibility.booking;

    // 2. Format category ratings
    const validCategories = {};
    ['cleanliness', 'location', 'service', 'value'].forEach((key) => {
      if (categories[key] && Number(categories[key]) >= 1 && Number(categories[key]) <= 5) {
        validCategories[key] = Number(categories[key]);
      }
    });

    // 3. XSS Sanitize Text Fields
    const sanitizedTitle = title ? xss(title.trim()) : '';
    const sanitizedComment = xss(comment.trim());

    // 4. Create Review
    const review = await Review.create({
      user: userId,
      booking: booking._id,
      hotel: booking.hotel._id || booking.hotel,
      rating: Number(rating),
      title: sanitizedTitle,
      comment: sanitizedComment,
      categories: validCategories,
      status: 'published',
      isVerifiedStay: true,
    });

    // 5. Update Hotel Rating Aggregate
    await ratingService.recalculateHotelRating(booking.hotel._id || booking.hotel);

    // Invalidate review & hotel rating caches
    await cacheService.invalidateReviewCache(booking.hotel._id || booking.hotel);

    // Audit Log
    await auditService.logEvent({
      actor: userId,
      action: 'REVIEW_CREATED',
      resourceType: 'Review',
      resourceId: review._id,
      status: 'success',
      metadata: { hotelId: booking.hotel._id || booking.hotel, rating },
    });

    // 6. Notify Manager about new review
    const hotel = await Hotel.findById(booking.hotel._id || booking.hotel).select('owner name');
    if (hotel && hotel.owner) {
      await notificationService.dispatchNotificationEvent('MANAGER_NEW_BOOKING', {
        recipientId: hotel.owner,
        bookingId: booking._id,
        bookingReference: booking.bookingReference,
        hotelName: hotel.name,
        customerName: 'Guest Review',
        roomName: `${rating}★ Review Received`,
        totalAmount: 0,
      });
    }

    return review;
  },

  // Edit existing customer review (XSS Sanitized)
  updateReview: async (userId, reviewId, rating, title, comment, categories = {}) => {
    const review = await Review.findById(reviewId);
    if (!review) {
      const err = new Error('Review record not found');
      err.statusCode = 404;
      throw err;
    }

    if (review.user.toString() !== userId.toString()) {
      const err = new Error('Forbidden: You can only edit your own reviews');
      err.statusCode = 403;
      throw err;
    }

    if (review.status === 'removed' || review.status === 'hidden') {
      const err = new Error('This review cannot be edited because it is unavailable or hidden');
      err.statusCode = 400;
      throw err;
    }

    // Format categories
    const validCategories = {};
    ['cleanliness', 'location', 'service', 'value'].forEach((key) => {
      if (categories[key] && Number(categories[key]) >= 1 && Number(categories[key]) <= 5) {
        validCategories[key] = Number(categories[key]);
      }
    });

    if (rating) review.rating = Number(rating);
    if (title !== undefined) review.title = xss(title.trim());
    if (comment !== undefined) review.comment = xss(comment.trim());
    review.categories = validCategories;

    await review.save();

    // Recalculate rating stats
    await ratingService.recalculateHotelRating(review.hotel);

    // Invalidate review cache
    await cacheService.invalidateReviewCache(review.hotel);

    return review;
  },

  // Delete customer review (Soft-delete status = 'removed')
  deleteReview: async (userId, reviewId, isAdmin = false) => {
    const review = await Review.findById(reviewId);
    if (!review) {
      const err = new Error('Review record not found');
      err.statusCode = 404;
      throw err;
    }

    if (!isAdmin && review.user.toString() !== userId.toString()) {
      const err = new Error('Forbidden: You can only delete your own reviews');
      err.statusCode = 403;
      throw err;
    }

    review.status = 'removed';
    await review.save();

    // Recalculate rating stats
    await ratingService.recalculateHotelRating(review.hotel);

    // Invalidate review cache
    await cacheService.invalidateReviewCache(review.hotel);

    return { success: true, message: 'Review deleted successfully' };
  },

  // Public hotel reviews list with pagination & sorting
  getPublicHotelReviews: async (hotelId, page = 1, limit = 10, sort = 'recent') => {
    const cacheKey = cacheService.generateKey.reviews(hotelId, page, limit, sort);

    return await cacheService.getOrSet(cacheKey, 300, async () => {
      const query = { hotel: hotelId, status: 'published' };
      const skip = (Number(page) - 1) * Number(limit);

      let sortOptions = { createdAt: -1 };
      if (sort === 'highest') sortOptions = { rating: -1, createdAt: -1 };
      if (sort === 'lowest') sortOptions = { rating: 1, createdAt: -1 };

      const total = await Review.countDocuments(query);
      const reviews = await Review.find(query)
        .populate('user', 'name profileImage')
        .populate('managerResponse.respondedBy', 'name')
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit));

      return {
        reviews,
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      };
    });
  },

  // Customer submitted reviews
  getMyReviews: async (userId) => {
    const reviews = await Review.find({ user: userId, status: { $ne: 'removed' } })
      .populate('hotel', 'name city location images')
      .populate('booking', 'bookingReference checkIn checkOut')
      .sort({ createdAt: -1 });

    return reviews;
  },

  // Manager property reviews list
  getManagerReviews: async (managerId) => {
    const managerHotels = await Hotel.find({ owner: managerId }).select('_id');
    const hotelIds = managerHotels.map((h) => h._id);

    const reviews = await Review.find({ hotel: { $in: hotelIds }, status: { $ne: 'removed' } })
      .populate('user', 'name email profileImage')
      .populate('hotel', 'name city')
      .populate('booking', 'bookingReference checkIn checkOut')
      .sort({ createdAt: -1 });

    return reviews;
  },

  // Manager official response (XSS Sanitized)
  postManagerResponse: async (managerId, reviewId, comment) => {
    const review = await Review.findById(reviewId).populate('hotel', 'owner name');
    if (!review) {
      const err = new Error('Review record not found');
      err.statusCode = 404;
      throw err;
    }

    if (review.hotel.owner.toString() !== managerId.toString()) {
      const err = new Error('Forbidden: You can only respond to reviews for hotels you own');
      err.statusCode = 403;
      throw err;
    }

    review.managerResponse = {
      comment: xss(comment.trim()),
      respondedAt: new Date(),
      respondedBy: managerId,
    };

    await review.save();

    // Invalidate review cache
    await cacheService.invalidateReviewCache(review.hotel._id || review.hotel);

    await auditService.logEvent({
      actor: managerId,
      action: 'MANAGER_RESPONSE_CREATED',
      resourceType: 'Review',
      resourceId: review._id,
      status: 'success',
    });

    return review;
  },

  // User report review for abuse
  reportReview: async (userId, reviewId, reason, description = '') => {
    const review = await Review.findById(reviewId);
    if (!review) {
      const err = new Error('Review record not found');
      err.statusCode = 404;
      throw err;
    }

    // Create report or handle duplicate
    const report = await ReviewReport.findOneAndUpdate(
      { review: reviewId, reportedBy: userId },
      {
        review: reviewId,
        reportedBy: userId,
        reason,
        description: xss(description.trim()),
        status: 'pending',
      },
      { upsert: true, new: true }
    );

    // Update review report count and status if necessary
    review.reportCount = (review.reportCount || 0) + 1;
    if (review.status === 'published') {
      review.status = 'reported';
    }
    await review.save();

    // Invalidate review cache
    await cacheService.invalidateReviewCache(review.hotel);

    await auditService.logEvent({
      actor: userId,
      action: 'REVIEW_REPORTED',
      resourceType: 'ReviewReport',
      resourceId: report._id,
      status: 'success',
      metadata: { reviewId, reason },
    });

    return report;
  },

  // Admin get reported reviews list
  getAdminReports: async () => {
    const reports = await ReviewReport.find({ status: 'pending' })
      .populate({
        path: 'review',
        populate: [
          { path: 'user', select: 'name email' },
          { path: 'hotel', select: 'name city' },
        ],
      })
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 });

    return reports;
  },

  // Admin moderation resolution
  resolveAdminReport: async (adminId, reportId, action) => {
    const report = await ReviewReport.findById(reportId).populate('review');
    if (!report) {
      const err = new Error('Report record not found');
      err.statusCode = 404;
      throw err;
    }

    if (action === 'action_taken') {
      report.status = 'action_taken';
      if (report.review) {
        report.review.status = 'hidden';
        await report.review.save();
        await ratingService.recalculateHotelRating(report.review.hotel);
        await cacheService.invalidateReviewCache(report.review.hotel);
      }
    } else {
      report.status = 'dismissed';
      if (report.review && report.review.status === 'reported') {
        report.review.status = 'published';
        await report.review.save();
        await cacheService.invalidateReviewCache(report.review.hotel);
      }
    }

    report.resolvedBy = adminId;
    report.resolvedAt = new Date();
    await report.save();

    await auditService.logEvent({
      actor: adminId,
      action: 'REVIEW_MODERATED',
      resourceType: 'ReviewReport',
      resourceId: reportId,
      status: 'success',
      metadata: { action },
    });

    return report;
  },

  // Admin toggle review status (hide / restore)
  updateReviewStatusByAdmin: async (adminId, reviewId, status) => {
    const review = await Review.findById(reviewId);
    if (!review) {
      const err = new Error('Review record not found');
      err.statusCode = 404;
      throw err;
    }

    review.status = status;
    await review.save();

    // Recalculate rating statistics
    await ratingService.recalculateHotelRating(review.hotel);

    // Invalidate review cache
    await cacheService.invalidateReviewCache(review.hotel);

    await auditService.logEvent({
      actor: adminId,
      action: 'REVIEW_MODERATED',
      resourceType: 'Review',
      resourceId: reviewId,
      status: 'success',
      metadata: { status },
    });

    return review;
  },
};

module.exports = reviewService;
