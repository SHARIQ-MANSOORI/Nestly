const request = require('supertest');
const dbHandler = require('../helpers/dbHandler');
const app = require('../../app');
const Review = require('../../models/Review');
const ReviewReport = require('../../models/ReviewReport');
const { createTestUsers, createTestHotel, createTestRoom, createTestBooking } = require('../fixtures/fixtures');

describe('Reviews, Ratings & Reputation System API Tests', () => {
  let fixtures, hotel, room, booking;

  beforeAll(async () => {
    await dbHandler.connect();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  beforeEach(async () => {
    await dbHandler.clearDatabase();
    fixtures = await createTestUsers();
    hotel = await createTestHotel(fixtures.managerA._id);
    room = await createTestRoom(hotel._id);

    // Create completed booking in the past
    booking = await createTestBooking(fixtures.customerA._id, hotel._id, room._id, {
      status: 'completed',
      paymentStatus: 'paid',
      checkIn: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      checkOut: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    });
  });

  describe('POST /api/reviews (Submission & Eligibility)', () => {
    it('should allow eligible customer with completed stay to submit review', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Cookie', fixtures.cookieA)
        .send({
          bookingId: booking._id,
          rating: 5,
          title: 'Unforgettable Beachfront Stay',
          comment: 'The resort hospitality, pristine room cleanliness, and ocean views were extraordinary.',
          categories: { cleanliness: 5, location: 5, service: 5, value: 5 },
        });

      expect(res.status).toBe(201);
      expect(res.body.data.rating).toBe(5);
      expect(res.body.data.isVerifiedStay).toBe(true);

      // Verify hotel average rating updated
      const updatedHotelRes = await request(app).get(`/api/hotels/${hotel._id}`);
      expect(updatedHotelRes.body.data.rating).toBe(5);
      expect(updatedHotelRes.body.data.reviewCount).toBe(1);
    });

    it('should reject duplicate review submission for the same booking ID', async () => {
      // First review
      await request(app)
        .post('/api/reviews')
        .set('Cookie', fixtures.cookieA)
        .send({
          bookingId: booking._id,
          rating: 5,
          title: 'First Review Title',
          comment: 'Great stay experience at Nestly hotel resort.',
        });

      // Second attempt
      const res = await request(app)
        .post('/api/reviews')
        .set('Cookie', fixtures.cookieA)
        .send({
          bookingId: booking._id,
          rating: 4,
          title: 'Duplicate Attempt Title',
          comment: 'Attempting to write a second review for the same stay.',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already submitted');
    });

    it('should reject review submission for uncompleted future booking', async () => {
      const futureBooking = await createTestBooking(fixtures.customerB._id, hotel._id, room._id, {
        status: 'confirmed',
        checkIn: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        checkOut: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      });

      const res = await request(app)
        .post('/api/reviews')
        .set('Cookie', fixtures.cookieB)
        .send({
          bookingId: futureBooking._id,
          rating: 5,
          comment: 'Attempting to review future stay.',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBeDefined();
    });
  });

  describe('POST /api/reviews/:id/response (Manager Responses)', () => {
    it('should allow Manager A to respond to customer review', async () => {
      const review = await Review.create({
        user: fixtures.customerA._id,
        hotel: hotel._id,
        booking: booking._id,
        rating: 5,
        title: 'Lovely Stay',
        comment: 'We loved the pool area and ocean view.',
      });

      const res = await request(app)
        .post(`/api/reviews/${review._id}/response`)
        .set('Cookie', fixtures.cookieMgrA)
        .send({ comment: 'Thank you for choosing Grand Horizon Resort!' });

      expect(res.status).toBe(200);
      expect(res.body.data.managerResponse.comment).toContain('Thank you');
    });
  });

  describe('POST /api/reviews/:id/report & Admin Moderation', () => {
    it('should allow user to report review and admin to moderate it', async () => {
      const review = await Review.create({
        user: fixtures.customerA._id,
        hotel: hotel._id,
        booking: booking._id,
        rating: 1,
        title: 'Bad Experience',
        comment: 'Abusive spam text for testing moderation pipeline.',
      });

      // Customer B reports review
      const reportRes = await request(app)
        .post(`/api/reviews/${review._id}/report`)
        .set('Cookie', fixtures.cookieB)
        .send({ reason: 'spam', description: 'Abusive text' });

      expect([200, 201]).toContain(reportRes.status);

      // Admin resolves report
      const report = await ReviewReport.findOne({ review: review._id });
      expect(report).toBeDefined();

      const modReportRes = await request(app)
        .patch(`/api/reviews/admin/reports/${report._id}`)
        .set('Cookie', fixtures.cookieAdmin)
        .send({ action: 'action_taken' });

      expect(modReportRes.status).toBe(200);

      // Admin hides review
      const hideRes = await request(app)
        .patch(`/api/reviews/admin/reviews/${review._id}/status`)
        .set('Cookie', fixtures.cookieAdmin)
        .send({ status: 'hidden' });

      expect(hideRes.status).toBe(200);

      const hiddenReview = await Review.findById(review._id);
      expect(hiddenReview.status).toBe('hidden');
    });
  });
});
