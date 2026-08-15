const dbHandler = require('../helpers/dbHandler');
const reviewEligibilityService = require('../../services/reviewEligibilityService');
const Review = require('../../models/Review');
const { createTestHotel, createTestRoom, createTestBooking, createTestUsers } = require('../fixtures/fixtures');

describe('Review Eligibility Service Unit Tests', () => {
  let users, hotel, room;

  beforeAll(async () => {
    await dbHandler.connect();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  beforeEach(async () => {
    await dbHandler.clearDatabase();
    users = await createTestUsers();
    hotel = await createTestHotel(users.managerA._id);
    room = await createTestRoom(hotel._id);
  });

  it('should approve eligibility for completed stay after check-out date', async () => {
    const pastCheckIn = new Date();
    pastCheckIn.setDate(pastCheckIn.getDate() - 5);
    const pastCheckOut = new Date();
    pastCheckOut.setDate(pastCheckOut.getDate() - 2);

    const booking = await createTestBooking(users.customerA._id, hotel._id, room._id, {
      checkIn: pastCheckIn,
      checkOut: pastCheckOut,
      status: 'completed',
    });

    const eligibility = await reviewEligibilityService.checkReviewEligibility(booking._id, users.customerA._id);
    expect(eligibility.eligible).toBe(true);
  });

  it('should reject eligibility if check-out date is in the future', async () => {
    const futureCheckIn = new Date();
    futureCheckIn.setDate(futureCheckIn.getDate() + 2);
    const futureCheckOut = new Date();
    futureCheckOut.setDate(futureCheckOut.getDate() + 5);

    const booking = await createTestBooking(users.customerA._id, hotel._id, room._id, {
      checkIn: futureCheckIn,
      checkOut: futureCheckOut,
      status: 'confirmed',
    });

    const eligibility = await reviewEligibilityService.checkReviewEligibility(booking._id, users.customerA._id);
    expect(eligibility.eligible).toBe(false);
    expect(eligibility.reason).toBe('CHECKOUT_NOT_REACHED');
  });

  it('should reject eligibility for cancelled reservations', async () => {
    const pastCheckIn = new Date();
    pastCheckIn.setDate(pastCheckIn.getDate() - 5);
    const pastCheckOut = new Date();
    pastCheckOut.setDate(pastCheckOut.getDate() - 2);

    const booking = await createTestBooking(users.customerA._id, hotel._id, room._id, {
      checkIn: pastCheckIn,
      checkOut: pastCheckOut,
      status: 'cancelled',
    });

    const eligibility = await reviewEligibilityService.checkReviewEligibility(booking._id, users.customerA._id);
    expect(eligibility.eligible).toBe(false);
    expect(eligibility.reason).toBe('CANCELLED_BOOKING');
  });

  it('should reject eligibility if user has already submitted a review for the booking', async () => {
    const pastCheckIn = new Date();
    pastCheckIn.setDate(pastCheckIn.getDate() - 5);
    const pastCheckOut = new Date();
    pastCheckOut.setDate(pastCheckOut.getDate() - 2);

    const booking = await createTestBooking(users.customerA._id, hotel._id, room._id, {
      checkIn: pastCheckIn,
      checkOut: pastCheckOut,
      status: 'completed',
    });

    await Review.create({
      user: users.customerA._id,
      booking: booking._id,
      hotel: hotel._id,
      rating: 5,
      comment: 'First review',
    });

    const eligibility = await reviewEligibilityService.checkReviewEligibility(booking._id, users.customerA._id);
    expect(eligibility.eligible).toBe(false);
    expect(eligibility.reason).toBe('ALREADY_REVIEWED');
  });
});
