const dbHandler = require('../helpers/dbHandler');
const { checkRoomAvailability } = require('../../services/availabilityService');
const { createTestHotel, createTestRoom, createTestBooking, createTestUsers } = require('../fixtures/fixtures');

describe('Room Availability Service Unit Tests', () => {
  let user, hotel, room;

  beforeAll(async () => {
    await dbHandler.connect();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  beforeEach(async () => {
    await dbHandler.clearDatabase();
    const users = await createTestUsers();
    user = users.customerA;
    hotel = await createTestHotel(users.managerA._id);
    room = await createTestRoom(hotel._id, { totalRooms: 1 });
  });

  it('should return available=true when room has no bookings for date range', async () => {
    const res = await checkRoomAvailability(room._id, '2026-10-01', '2026-10-04', 1);
    expect(res.available).toBe(true);
    expect(res.availableUnits).toBe(1);
    expect(res.totalRooms).toBe(1);
  });

  it('should return available=false when room is already booked for overlapping date interval', async () => {
    // Existing Booking: Oct 10 to Oct 15
    const checkIn = new Date('2026-10-10');
    const checkOut = new Date('2026-10-15');
    await createTestBooking(user._id, hotel._id, room._id, { checkIn, checkOut });

    // Request A: Oct 12 to Oct 14 (Completely inside existing booking)
    const resA = await checkRoomAvailability(room._id, '2026-10-12', '2026-10-14', 1);
    expect(resA.available).toBe(false);
    expect(resA.availableUnits).toBe(0);

    // Request B: Oct 08 to Oct 12 (Overlaps start of existing booking)
    const resB = await checkRoomAvailability(room._id, '2026-10-08', '2026-10-12', 1);
    expect(resB.available).toBe(false);

    // Request C: Oct 14 to Oct 18 (Overlaps end of existing booking)
    const resC = await checkRoomAvailability(room._id, '2026-10-14', '2026-10-18', 1);
    expect(resC.available).toBe(false);
  });

  it('should allow adjacent bookings (Checkout = Check-in boundary rule)', async () => {
    // Existing Booking: Oct 10 to Oct 15
    const checkIn = new Date('2026-10-10');
    const checkOut = new Date('2026-10-15');
    await createTestBooking(user._id, hotel._id, room._id, { checkIn, checkOut });

    // Adjacent Request 1: Oct 07 to Oct 10 (Check-out is Oct 10, guest leaves before 2nd guest arrives)
    const res1 = await checkRoomAvailability(room._id, '2026-10-07', '2026-10-10', 1);
    expect(res1.available).toBe(true);

    // Adjacent Request 2: Oct 15 to Oct 18 (Check-in is Oct 15, guest arrives as 1st guest leaves)
    const res2 = await checkRoomAvailability(room._id, '2026-10-15', '2026-10-18', 1);
    expect(res2.available).toBe(true);
  });

  it('should exclude cancelled bookings from occupancy overlap evaluation', async () => {
    // Cancelled Booking: Oct 20 to Oct 25
    const checkIn = new Date('2026-10-20');
    const checkOut = new Date('2026-10-25');
    await createTestBooking(user._id, hotel._id, room._id, { checkIn, checkOut, status: 'cancelled' });

    // Request: Oct 20 to Oct 25 (Same dates as cancelled booking)
    const res = await checkRoomAvailability(room._id, '2026-10-20', '2026-10-25', 1);
    expect(res.available).toBe(true);
    expect(res.availableUnits).toBe(1);
  });
});
