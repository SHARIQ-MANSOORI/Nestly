const dbHandler = require('../helpers/dbHandler');
const ratingService = require('../../services/ratingService');
const Review = require('../../models/Review');
const Hotel = require('../../models/Hotel');
const { createTestHotel, createTestRoom, createTestBooking, createTestUsers } = require('../fixtures/fixtures');

describe('Rating Service Aggregation Unit Tests', () => {
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

  it('should reset hotel rating to 0 when hotel has zero published reviews', async () => {
    const updatedHotel = await ratingService.recalculateHotelRating(hotel._id);
    expect(updatedHotel.averageRating).toBe(0);
    expect(updatedHotel.reviewCount).toBe(0);
  });

  it('should accurately aggregate ratings, star distribution, and category scores', async () => {
    const booking1 = await createTestBooking(users.customerA._id, hotel._id, room._id, { status: 'completed' });
    const booking2 = await createTestBooking(users.customerB._id, hotel._id, room._id, { status: 'completed' });

    // Review 1: 5★
    await Review.create({
      user: users.customerA._id,
      booking: booking1._id,
      hotel: hotel._id,
      rating: 5,
      title: 'Amazing Stay',
      comment: 'Super clean and luxurious.',
      categories: { cleanliness: 5, location: 5, service: 5, value: 4 },
      status: 'published',
    });

    // Review 2: 3★
    await Review.create({
      user: users.customerB._id,
      booking: booking2._id,
      hotel: hotel._id,
      rating: 3,
      title: 'Average Stay',
      comment: 'Service was slow.',
      categories: { cleanliness: 3, location: 4, service: 2, value: 3 },
      status: 'published',
    });

    const updatedHotel = await ratingService.recalculateHotelRating(hotel._id);

    expect(updatedHotel.reviewCount).toBe(2);
    expect(updatedHotel.averageRating).toBe(4.0); // (5 + 3) / 2 = 4.0
    expect(updatedHotel.ratingBreakdown[5]).toBe(1);
    expect(updatedHotel.ratingBreakdown[3]).toBe(1);
    expect(updatedHotel.categoryRatings.cleanliness).toBe(4.0); // (5 + 3) / 2
    expect(updatedHotel.categoryRatings.location).toBe(4.5); // (5 + 4) / 2
    expect(updatedHotel.categoryRatings.service).toBe(3.5); // (5 + 2) / 2
  });

  it('should exclude hidden or removed reviews from rating calculations', async () => {
    const booking = await createTestBooking(users.customerA._id, hotel._id, room._id, { status: 'completed' });

    await Review.create({
      user: users.customerA._id,
      booking: booking._id,
      hotel: hotel._id,
      rating: 1,
      title: 'Bad',
      comment: 'Spam review',
      status: 'hidden', // Moderated
    });

    const updatedHotel = await ratingService.recalculateHotelRating(hotel._id);
    expect(updatedHotel.reviewCount).toBe(0);
    expect(updatedHotel.averageRating).toBe(0);
  });
});
