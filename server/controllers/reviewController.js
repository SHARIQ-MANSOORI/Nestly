const reviewService = require('../services/reviewService');
const reviewEligibilityService = require('../services/reviewEligibilityService');

// @desc    Check if customer is eligible to review a booking
// @route   GET /api/bookings/:bookingId/review-eligibility
// @access  Private (Customer)
const checkEligibility = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const result = await reviewEligibilityService.checkReviewEligibility(bookingId, req.user._id);

    res.status(200).json({
      success: true,
      eligible: result.eligible,
      reason: result.reason || null,
      existingReviewId: result.reviewId || null,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new verified review
// @route   POST /api/reviews
// @access  Private (Customer)
const createReview = async (req, res, next) => {
  try {
    const { bookingId, rating, title, comment, categories } = req.body;

    if (!bookingId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Please provide booking ID, rating (1-5), and review comment',
      });
    }

    const review = await reviewService.createReview(
      req.user._id,
      bookingId,
      rating,
      title,
      comment,
      categories || {}
    );

    res.status(201).json({
      success: true,
      message: 'Thank you! Your verified stay review has been published.',
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get public published reviews for a hotel
// @route   GET /api/hotels/:hotelId/reviews
// @access  Public
const getPublicHotelReviews = async (req, res, next) => {
  try {
    const { hotelId } = req.params;
    const { page = 1, limit = 10, sort = 'recent' } = req.query;

    const data = await reviewService.getPublicHotelReviews(hotelId, page, limit, sort);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged-in user's submitted reviews
// @route   GET /api/reviews/my
// @access  Private (Customer)
const getMyReviews = async (req, res, next) => {
  try {
    const reviews = await reviewService.getMyReviews(req.user._id);

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Edit existing customer review
// @route   PUT /api/reviews/:id
// @access  Private (Review Owner)
const updateReview = async (req, res, next) => {
  try {
    const { rating, title, comment, categories } = req.body;

    const review = await reviewService.updateReview(
      req.user._id,
      req.params.id,
      rating,
      title,
      comment,
      categories || {}
    );

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete customer review (Soft delete)
// @route   DELETE /api/reviews/:id
// @access  Private (Review Owner / Admin)
const deleteReview = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const result = await reviewService.deleteReview(req.user._id, req.params.id, isAdmin);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Report review for abuse
// @route   POST /api/reviews/:id/report
// @access  Private (Authenticated User)
const reportReview = async (req, res, next) => {
  try {
    const { reason, description } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Please select a reason for reporting this review',
      });
    }

    const report = await reviewService.reportReview(
      req.user._id,
      req.params.id,
      reason,
      description
    );

    res.status(200).json({
      success: true,
      message: 'Thank you. The review has been reported for moderation.',
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get manager's property reviews
// @route   GET /api/manager/reviews
// @access  Private (Manager / Admin)
const getManagerReviews = async (req, res, next) => {
  try {
    const reviews = await reviewService.getManagerReviews(req.user._id);

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Post official manager response to guest review
// @route   POST /api/reviews/:id/response
// @access  Private (Hotel Owner / Admin)
const postManagerResponse = async (req, res, next) => {
  try {
    const { comment } = req.body;

    if (!comment) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a manager response message',
      });
    }

    const review = await reviewService.postManagerResponse(req.user._id, req.params.id, comment);

    res.status(200).json({
      success: true,
      message: 'Manager response published successfully!',
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin get reported reviews
// @route   GET /api/admin/reports
// @access  Private (Admin)
const getAdminReports = async (req, res, next) => {
  try {
    const reports = await reviewService.getAdminReports();

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin resolve abuse report
// @route   PATCH /api/admin/reports/:id
// @access  Private (Admin)
const resolveAdminReport = async (req, res, next) => {
  try {
    const { action } = req.body; // 'dismiss' | 'action_taken'

    const report = await reviewService.resolveAdminReport(req.user._id, req.params.id, action);

    res.status(200).json({
      success: true,
      message: `Report resolved (${action})`,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin toggle review status
// @route   PATCH /api/admin/reviews/:id/status
// @access  Private (Admin)
const updateReviewStatusByAdmin = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['published', 'hidden', 'removed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status parameter',
      });
    }

    const review = await reviewService.updateReviewStatusByAdmin(req.user._id, req.params.id, status);

    res.status(200).json({
      success: true,
      message: `Review status updated to ${status}`,
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkEligibility,
  createReview,
  getPublicHotelReviews,
  getMyReviews,
  updateReview,
  deleteReview,
  reportReview,
  getManagerReviews,
  postManagerResponse,
  getAdminReports,
  resolveAdminReport,
  updateReviewStatusByAdmin,
};
