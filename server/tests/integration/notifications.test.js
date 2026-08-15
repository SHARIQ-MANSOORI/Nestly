const request = require('supertest');
const dbHandler = require('../helpers/dbHandler');
const app = require('../../app');
const Notification = require('../../models/Notification');
const { createTestUsers, createTestHotel, createTestRoom } = require('../fixtures/fixtures');

describe('Notification & Communication API Integration Tests', () => {
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
    room = await createTestRoom(hotel._id);
  });

  it('should generate in-app notifications on reservation creation for guest and manager', async () => {
    await request(app)
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

    // Check Customer Notifications
    const custNotifRes = await request(app)
      .get('/api/notifications')
      .set('Cookie', fixtures.cookieA);

    expect(custNotifRes.status).toBe(200);
    expect(custNotifRes.body.count).toBe(1);
    expect(custNotifRes.body.data[0].type).toBe('BOOKING_CONFIRMED');

    // Check Manager Notifications
    const mgrNotifRes = await request(app)
      .get('/api/notifications')
      .set('Cookie', fixtures.cookieMgrA);

    expect(mgrNotifRes.status).toBe(200);
    expect(mgrNotifRes.body.count).toBe(1);
    expect(mgrNotifRes.body.data[0].type).toBe('MANAGER_NEW_BOOKING');
  });

  it('should mark notification as read and decrement unread count', async () => {
    const notif = await Notification.create({
      user: fixtures.customerA._id,
      title: 'Test Notification',
      message: 'Notification message body',
      type: 'BOOKING_CONFIRMED',
      isRead: false,
    });

    const readRes = await request(app)
      .patch(`/api/notifications/${notif._id}/read`)
      .set('Cookie', fixtures.cookieA);

    expect(readRes.status).toBe(200);
    expect(readRes.body.data.isRead).toBe(true);

    const countRes = await request(app)
      .get('/api/notifications/unread-count')
      .set('Cookie', fixtures.cookieA);

    expect(countRes.body.unreadCount).toBe(0);
  });

  it('should prevent Customer B from marking Customer A notification as read (403 Forbidden)', async () => {
    const notif = await Notification.create({
      user: fixtures.customerA._id,
      title: 'Customer A Private Notification',
      message: 'Private message',
      type: 'BOOKING_CONFIRMED',
    });

    const res = await request(app)
      .patch(`/api/notifications/${notif._id}/read`)
      .set('Cookie', fixtures.cookieB);

    expect(res.status).toBe(403);
  });
});
