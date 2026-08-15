const request = require('supertest');
const dbHandler = require('../helpers/dbHandler');
const app = require('../../app');
const AuditLog = require('../../models/AuditLog');
const { createTestUsers } = require('../fixtures/fixtures');

describe('Security Hardening & Production Defense Integration Tests', () => {
  let fixtures;

  beforeAll(async () => {
    await dbHandler.connect();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  beforeEach(async () => {
    await dbHandler.clearDatabase();
    fixtures = await createTestUsers();
  });

  describe('NoSQL Injection Defense', () => {
    it('should sanitize or reject NoSQL operator injection payloads safely', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: { $gt: '' }, // NoSQL query injection payload
          password: 'Password123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Stored XSS Defense', () => {
    it('should sanitize HTML script tags from review comments', async () => {
      const pastCheckIn = new Date();
      pastCheckIn.setDate(pastCheckIn.getDate() - 5);
      const pastCheckOut = new Date();
      pastCheckOut.setDate(pastCheckOut.getDate() - 2);

      const { createTestHotel, createTestRoom, createTestBooking } = require('../fixtures/fixtures');
      const hotel = await createTestHotel(fixtures.managerA._id);
      const room = await createTestRoom(hotel._id);
      const booking = await createTestBooking(fixtures.customerA._id, hotel._id, room._id, {
        checkIn: pastCheckIn,
        checkOut: pastCheckOut,
        status: 'completed',
      });

      const res = await request(app)
        .post('/api/reviews')
        .set('Cookie', fixtures.cookieA)
        .send({
          bookingId: booking._id,
          rating: 5,
          title: "<script>alert('xss')</script>Great Stay",
          comment: "<script>alert('malicious')</script>Loved the resort pool!",
        });

      expect(res.status).toBe(201);
      expect(res.body.data.comment).not.toContain('<script>');
      expect(res.body.data.title).not.toContain('<script>');
    });
  });

  describe('Request Body Size Limits', () => {
    it('should reject oversized JSON request payloads exceeding 10kb', async () => {
      const oversizedString = 'A'.repeat(15 * 1024); // 15kb string
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: oversizedString });

      expect(res.status).toBe(413); // Payload Too Large
    });
  });

  describe('Audit Logging System', () => {
    it('should record security audit logs for role escalation attempts and admin log inspection', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Attacker',
          email: 'attacker@example.com',
          password: 'Password123!',
          role: 'admin', // Escalation attempt
        });

      const logsRes = await request(app)
        .get('/api/admin/audit-logs')
        .set('Cookie', fixtures.cookieAdmin);

      expect(logsRes.status).toBe(200);
      expect(logsRes.body.data.total).toBeGreaterThan(0);
    });
  });
});
