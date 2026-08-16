const Booking = require('../models/Booking');
const Review = require('../models/Review');

const reviewEligibilityService = {
  /**
   * Verified Stay Eligibility Verification Engine
   * Validates if user completed an eligible stay before submitting a review
   */
  checkReviewEligibility: async (bookingId, userId) => {
    const booking = await Booking.findById(bookingId).populate('hotel', 'owner name');

    if (!booking) {
      return { eligible: false, reason: 'BOOKING_NOT_FOUND' };
    }

    // 1. Ownership Guard: Must be the customer who booked
    if (booking.user.toString() !== userId.toString()) {
      return { eligible: false, reason: 'NOT_OWNER' };
    }

    // 2. Self-Review Protection: Hotel owner cannot review their own hotel
    if (booking.hotel && booking.hotel.owner && booking.hotel.owner.toString() === userId.toString()) {
      return { eligible: false, reason: 'MANAGER_OWNED_HOTEL' };
    }

    // 3. Status Check: Cancelled or expired bookings are ineligible
    if (booking.status === 'cancelled' || booking.status === 'expired') {
      return { eligible: false, reason: 'CANCELLED_BOOKING' };
    }

    // 4. Stay Completion Check: Check-out date must have passed OR status is completed
    const now = new Date();
    const checkOutDate = new Date(booking.checkOut);
    const isCompletedStay = booking.status === 'completed' || (booking.status === 'confirmed' && checkOutDate <= now);

    if (!isCompletedStay) {
      return { eligible: false, reason: 'CHECKOUT_NOT_REACHED' };
    }

    // 5. One Review Per Booking Guard: Check database for existing review
    const existingReview = await Review.findOne({ booking: booking._id });
    if (existingReview) {
      return {
        eligible: false,
        reason: 'ALREADY_REVIEWED',
        reviewId: existingReview._id,
      };
    }

    return {
      eligible: true,
      booking,
    };
  },
};

module.exports = reviewEligibilityService;
