const request = require('supertest');
const dbHandler = require('../helpers/dbHandler');
const app = require('../../app');
const Hotel = require('../../models/Hotel');
const Room = require('../../models/Room');
const { createTestUsers, createTestHotel } = require('../fixtures/fixtures');

describe('Hotel & Room Management Integration Tests', () => {
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

  describe('Manager Hotel Property Operations', () => {
    it('should allow Manager A to create new hotel property', async () => {
      const res = await request(app)
        .post('/api/hotels')
        .set('Cookie', fixtures.cookieMgrA)
        .send({
          name: 'Grand Horizon Resort & Spa',
          description: 'Luxury oceanfront resort with pool.',
          city: 'Goa',
          address: 'Beach Road, Calangute',
          location: 'Calangute, North Goa',
          amenities: ['Pool', 'WiFi', 'Beach Access'],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Grand Horizon Resort & Spa');
      expect(res.body.data.owner.toString()).toBe(fixtures.managerA._id.toString());
      expect(res.body.data.status).toBe('active');
    });

    it('should reject Customer from creating a hotel property', async () => {
      const res = await request(app)
        .post('/api/hotels')
        .set('Cookie', fixtures.cookieA)
        .send({
          name: 'Customer Hotel Attempt',
          description: 'Test description',
          city: 'Mumbai',
          address: 'Main Street',
        });

      expect(res.status).toBe(403);
    });

    it('should prevent Manager B from modifying Manager A hotel property', async () => {
      const hotelA = await createTestHotel(fixtures.managerA._id);

      const res = await request(app)
        .put(`/api/hotels/${hotelA._id}`)
        .set('Cookie', fixtures.cookieMgrB)
        .send({
          name: 'Hacked Hotel Name',
        });

      expect(res.status).toBe(403);
    });

    it('should soft deactivate hotel property on deletion (status = inactive)', async () => {
      const hotelA = await createTestHotel(fixtures.managerA._id);

      const res = await request(app)
        .delete(`/api/hotels/${hotelA._id}`)
        .set('Cookie', fixtures.cookieMgrA);

      expect(res.status).toBe(200);

      const checkHotel = await Hotel.findById(hotelA._id);
      expect(checkHotel.status).toBe('inactive');
    });
  });

  describe('Manager Room Inventory Operations', () => {
    it('should allow Manager A to create room package and recalculate hotel startingPrice', async () => {
      const hotelA = await createTestHotel(fixtures.managerA._id, { startingPrice: 0 });

      const roomRes = await request(app)
        .post(`/api/hotels/${hotelA._id}/rooms`)
        .set('Cookie', fixtures.cookieMgrA)
        .send({
          name: 'Executive Sea Suite',
          type: 'Executive Suite',
          pricePerNight: 7500,
          capacity: 3,
          description: 'Oceanfront suite with balcony.',
        });

      expect(roomRes.status).toBe(201);

      const updatedHotel = await Hotel.findById(hotelA._id);
      expect(updatedHotel.startingPrice).toBe(7500);
    });

    it('should prevent Manager B from adding room to Manager A hotel', async () => {
      const hotelA = await createTestHotel(fixtures.managerA._id);

      const res = await request(app)
        .post(`/api/hotels/${hotelA._id}/rooms`)
        .set('Cookie', fixtures.cookieMgrB)
        .send({
          name: 'Unauthorized Room',
          type: 'Deluxe',
          pricePerNight: 3000,
          capacity: 2,
          description: 'Unauthorized addition',
        });

      expect(res.status).toBe(403);
    });
  });
});
