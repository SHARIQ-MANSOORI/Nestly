const request = require('supertest');
const dbHandler = require('../helpers/dbHandler');
const app = require('../../app');
const { createTestUsers, createTestHotel, createTestRoom, createTestBooking } = require('../fixtures/fixtures');

describe('Analytics & Reporting API Integration Tests', () => {
  let fixtures, hotelA, hotelB, roomA;

  beforeAll(async () => {
    await dbHandler.connect();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  beforeEach(async () => {
    await dbHandler.clearDatabase();
    fixtures = await createTestUsers();
    hotelA = await createTestHotel(fixtures.managerA._id);
    hotelB = await createTestHotel(fixtures.managerB._id);
    roomA = await createTestRoom(hotelA._id, { pricePerNight: 5000 });
    await createTestRoom(hotelB._id, { pricePerNight: 8000 });

    // Seed confirmed paid booking for Manager A
    await createTestBooking(fixtures.customerA._id, hotelA._id, roomA._id, {
      status: 'confirmed',
      paymentStatus: 'paid',
      subtotal: 15000,
      taxes: 1800,
      totalAmount: 16800,
    });
  });

  describe('GET /api/analytics/manager/overview', () => {
    it('should calculate revenue and metrics strictly scoped to Manager A properties', async () => {
      const res = await request(app)
        .get('/api/analytics/manager/overview')
        .set('Cookie', fixtures.cookieMgrA);

      expect(res.status).toBe(200);
      expect(res.body.data.kpis.grossRevenue).toBe(16800);
      expect(res.body.data.kpis.netRevenue).toBe(16800);
      expect(res.body.data.kpis.totalBookings).toBe(1);
    });

    it('should return zero metrics for Manager B who has no confirmed paid bookings', async () => {
      const res = await request(app)
        .get('/api/analytics/manager/overview')
        .set('Cookie', fixtures.cookieMgrB);

      expect(res.status).toBe(200);
      expect(res.body.data.kpis.grossRevenue).toBe(0);
      expect(res.body.data.kpis.totalBookings).toBe(0);
    });

    it('should reject Customer from accessing manager analytics (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/analytics/manager/overview')
        .set('Cookie', fixtures.cookieA);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/analytics/admin/overview', () => {
    it('should calculate platform-wide metrics for Admin user', async () => {
      const res = await request(app)
        .get('/api/analytics/admin/overview')
        .set('Cookie', fixtures.cookieAdmin);

      expect(res.status).toBe(200);
      expect(res.body.data.kpis.totalHotels).toBe(2);
      expect(res.body.data.kpis.grossRevenue).toBe(16800);
    });
  });
});
