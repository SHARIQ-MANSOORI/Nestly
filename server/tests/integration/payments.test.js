const request = require('supertest');
const dbHandler = require('../helpers/dbHandler');
const app = require('../../app');
const { createTestUsers, createTestHotel, createTestRoom, createTestBooking } = require('../fixtures/fixtures');

describe('Payment Integration & Security API Tests', () => {
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
    room = await createTestRoom(hotel._id, { pricePerNight: 5000 });
    booking = await createTestBooking(fixtures.customerA._id, hotel._id, room._id, { totalAmount: 16800 });
  });

  describe('POST /api/payments/create-order (Server Amount Authority)', () => {
    it('should create payment order using database totalAmount in paise subunits', async () => {
      const res = await request(app)
        .post('/api/payments/create-order')
        .set('Cookie', fixtures.cookieA)
        .send({ bookingId: booking._id });

      expect(res.status).toBe(200);
      expect(res.body.data.orderId).toBeDefined();
      expect(res.body.data.amountInSubunits).toBe(1680000); // 16800 * 100
      expect(res.body.data.amount).toBe(16800);
    });

    it('should ignore client-side price tampering parameter', async () => {
      const res = await request(app)
        .post('/api/payments/create-order')
        .set('Cookie', fixtures.cookieA)
        .send({ bookingId: booking._id, amount: 100 }); // Attempting ₹1 tamper

      expect(res.status).toBe(200);
      expect(res.body.data.amountInSubunits).toBe(1680000); // Strictly ₹16,800
    });

    it('should reject Manager B from creating payment order for Customer A booking (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/payments/create-order')
        .set('Cookie', fixtures.cookieMgrB)
        .send({ bookingId: booking._id });

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/payments/verify (HMAC Verification)', () => {
    it('should reject forged HMAC signature', async () => {
      const res = await request(app)
        .post('/api/payments/verify')
        .set('Cookie', fixtures.cookieA)
        .send({
          bookingId: booking._id,
          razorpayOrderId: 'order_fake_123',
          razorpayPaymentId: 'pay_fake_123',
          razorpaySignature: 'forged_signature_hash',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('signature');
    });

    it('should process valid HMAC signature idempotently', async () => {
      // Create Order
      const orderRes = await request(app)
        .post('/api/payments/create-order')
        .set('Cookie', fixtures.cookieA)
        .send({ bookingId: booking._id });

      const orderId = orderRes.body.data.orderId;
      const paymentId = 'pay_sandbox_12345';
      const signature = `test_sig_${orderId}_${paymentId}`;

      // Verify Payment 1st call
      const verifyRes1 = await request(app)
        .post('/api/payments/verify')
        .set('Cookie', fixtures.cookieA)
        .send({
          bookingId: booking._id,
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: signature,
        });

      expect(verifyRes1.status).toBe(200);
      expect(verifyRes1.body.booking.paymentStatus).toBe('paid');

      // Verify Payment 2nd call (Idempotency check)
      const verifyRes2 = await request(app)
        .post('/api/payments/verify')
        .set('Cookie', fixtures.cookieA)
        .send({
          bookingId: booking._id,
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: signature,
        });

      expect(verifyRes2.status).toBe(200);
      expect(verifyRes2.body.message).toContain('already');
    });
  });
});
