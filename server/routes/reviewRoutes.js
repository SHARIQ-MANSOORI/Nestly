const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const {
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
} = require('../controllers/reviewController');

// Public Hotel Reviews Endpoint
router.get('/hotels/:hotelId/reviews', getPublicHotelReviews);

// Protected Customer Endpoints
router.get('/bookings/:bookingId/review-eligibility', protect, checkEligibility);
router.get('/my', protect, getMyReviews);
router.post('/', protect, createReview);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);
router.post('/:id/report', protect, reportReview);

// Protected Manager Endpoints
router.get('/manager/all', protect, authorize('manager', 'admin'), getManagerReviews);
router.post('/:id/response', protect, authorize('manager', 'admin'), postManagerResponse);

// Protected Admin Endpoints
router.get('/admin/reports', protect, authorize('admin'), getAdminReports);
router.patch('/admin/reports/:id', protect, authorize('admin'), resolveAdminReport);
router.patch('/admin/reviews/:id/status', protect, authorize('admin'), updateReviewStatusByAdmin);

module.exports = router;
