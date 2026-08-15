const request = require('supertest');
const dbHandler = require('../helpers/dbHandler');
const app = require('../../app');
const Booking = require('../../models/Booking');
const { createTestUsers, createTestHotel, createTestRoom, createTestBooking } = require('../fixtures/fixtures');

describe('Booking Engine & Concurrency Integration Tests', () => {
  let fixtures, hotel, room;

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
    room = await createTestRoom(hotel._id, { pricePerNight: 4000, totalRooms: 1 });
  });

  describe('Reservation Creation & Price Snapshots', () => {
    it('should create booking and record permanent price snapshot', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Cookie', fixtures.cookieA)
        .send({
          hotelId: hotel._id,
          roomId: room._id,
          checkIn: '2026-11-01',
          checkOut: '2026-11-04',
          roomsBooked: 1,
          guests: 2,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.bookingReference).toMatch(/^NST-2026-/);
      expect(res.body.data.pricePerNight).toBe(4000);
      expect(res.body.data.numberOfNights).toBe(3);
      expect(res.body.data.subtotal).toBe(12000); // 4000 * 3
      expect(res.body.data.taxes).toBe(1440); // 12000 * 0.12
      expect(res.body.data.totalAmount).toBe(13440);
      expect(res.body.data.status).toBe('confirmed');
      expect(res.body.data.paymentStatus).toBe('unpaid');
    });

    it('should reject booking if check-in date is in the past', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Cookie', fixtures.cookieA)
        .send({
          hotelId: hotel._id,
          roomId: room._id,
          checkIn: '2020-01-01',
          checkOut: '2020-01-04',
          roomsBooked: 1,
          guests: 2,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('past');
    });

    it('should reject booking if check-out date is before or equal to check-in', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Cookie', fixtures.cookieA)
        .send({
          hotelId: hotel._id,
          roomId: room._id,
          checkIn: '2026-11-10',
          checkOut: '2026-11-10',
          roomsBooked: 1,
          guests: 2,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('after');
    });
  });

  describe('Concurrency & Double-Booking Protection', () => {
    it('should prevent double-booking when 2 parallel requests hit single room inventory', async () => {
      const reqA = request(app)
        .post('/api/bookings')
        .set('Cookie', fixtures.cookieA)
        .send({
          hotelId: hotel._id,
          roomId: room._id,
          checkIn: '2026-12-01',
          checkOut: '2026-12-04',
          roomsBooked: 1,
          guests: 2,
        });

      const reqB = request(app)
        .post('/api/bookings')
        .set('Cookie', fixtures.cookieB)
        .send({
          hotelId: hotel._id,
          roomId: room._id,
          checkIn: '2026-12-01',
          checkOut: '2026-12-04',
          roomsBooked: 1,
          guests: 2,
        });

      const [resA, resB] = await Promise.all([reqA, reqB]);

      const statuses = [resA.status, resB.status].sort();
      expect(statuses).toEqual([201, 409]); // One 201 Created, One 409 Conflict
    });
  });

  describe('Reservation Cancellation', () => {
    it('should cancel customer reservation and release room inventory', async () => {
      const checkIn = new Date();
      checkIn.setDate(checkIn.getDate() + 5);
      const checkOut = new Date(checkIn);
      checkOut.setDate(checkOut.getDate() + 3);

      const booking = await createTestBooking(fixtures.customerA._id, hotel._id, room._id, {
        checkIn,
        checkOut,
      });

      const cancelRes = await request(app)
        .post(`/api/bookings/${booking._id}/cancel`)
        .set('Cookie', fixtures.cookieA)
        .send({ cancellationReason: 'Plans changed' });

      expect(cancelRes.status).toBe(200);

      const checkBooking = await Booking.findById(booking._id);
      expect(checkBooking.status).toBe('cancelled');
    });

    it('should prevent Customer B from cancelling Customer A reservation (403 Forbidden)', async () => {
      const checkIn = new Date();
      checkIn.setDate(checkIn.getDate() + 5);
      const checkOut = new Date(checkIn);
      checkOut.setDate(checkOut.getDate() + 3);

      const booking = await createTestBooking(fixtures.customerA._id, hotel._id, room._id, {
        checkIn,
        checkOut,
      });

      const res = await request(app)
        .post(`/api/bookings/${booking._id}/cancel`)
        .set('Cookie', fixtures.cookieB);

      expect(res.status).toBe(403);
    });
  });
});
