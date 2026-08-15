const User = require('../../models/User');
const Hotel = require('../../models/Hotel');
const Room = require('../../models/Room');
const Booking = require('../../models/Booking');
const Review = require('../../models/Review');
const Payment = require('../../models/Payment');
const Notification = require('../../models/Notification');
const { generateToken } = require('../../utils/generateToken');

/**
 * Fixture: Create standard role-based test users
 */
const createTestUsers = async () => {
  const customerA = await User.create({
    name: 'Customer Alice',
    email: 'alice@test.com',
    password: 'Password123!',
    role: 'customer',
  });

  const customerB = await User.create({
    name: 'Customer Bob',
    email: 'bob@test.com',
    password: 'Password123!',
    role: 'customer',
  });

  const managerA = await User.create({
    name: 'Manager Alex',
    email: 'alex.mgr@test.com',
    password: 'Password123!',
    role: 'manager',
  });

  const managerB = await User.create({
    name: 'Manager Beth',
    email: 'beth.mgr@test.com',
    password: 'Password123!',
    role: 'manager',
  });

  const admin = await User.create({
    name: 'Admin Charlie',
    email: 'admin.charlie@test.com',
    password: 'Password123!',
    role: 'admin',
  });

  const tokenA = generateToken(customerA._id);
  const tokenB = generateToken(customerB._id);
  const tokenMgrA = generateToken(managerA._id);
  const tokenMgrB = generateToken(managerB._id);
  const tokenAdmin = generateToken(admin._id);

  return {
    customerA,
    customerB,
    managerA,
    managerB,
    admin,
    tokenA,
    tokenB,
    tokenMgrA,
    tokenMgrB,
    tokenAdmin,
    cookieA: `nestly_token=${tokenA}`,
    cookieB: `nestly_token=${tokenB}`,
    cookieMgrA: `nestly_token=${tokenMgrA}`,
    cookieMgrB: `nestly_token=${tokenMgrB}`,
    cookieAdmin: `nestly_token=${tokenAdmin}`,
  };
};

/**
 * Fixture: Create hotel property for manager
 */
const createTestHotel = async (managerId, overrides = {}) => {
  return await Hotel.create({
    name: 'Grand Horizon Resort',
    description: 'Luxury oceanfront resort with top amenities.',
    owner: managerId,
    location: 'Calangute, North Goa',
    city: 'Goa',
    country: 'India',
    addressDetails: { address: 'Beach Road', city: 'Goa', country: 'India' },
    amenities: ['Pool', 'WiFi', 'Spa', 'Restaurant'],
    images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945'],
    status: 'active',
    startingPrice: 5000,
    ...overrides,
  });
};

/**
 * Fixture: Create room package for hotel
 */
const createTestRoom = async (hotelId, overrides = {}) => {
  return await Room.create({
    hotel: hotelId,
    name: 'Deluxe Ocean Suite',
    description: 'Spacious suite with balcony view.',
    type: 'Executive Suite',
    pricePerNight: 5000,
    capacity: 2,
    totalRooms: 1,
    amenities: ['AC', 'TV', 'Minibar'],
    images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b'],
    status: 'available',
    ...overrides,
  });
};

/**
 * Fixture: Create reservation for customer & room
 */
const createTestBooking = async (userId, hotelId, roomId, overrides = {}) => {
  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + 10);
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + 3);

  return await Booking.create({
    bookingReference: `BK-TEST-${Math.floor(1000 + Math.random() * 9000)}`,
    user: userId,
    hotel: hotelId,
    room: roomId,
    checkIn,
    checkOut,
    guests: 2,
    roomsBooked: 1,
    numberOfNights: 3,
    pricePerNight: 5000,
    subtotal: 15000,
    taxes: 1800,
    discount: 0,
    totalAmount: 16800,
    status: 'confirmed',
    paymentStatus: 'unpaid',
    ...overrides,
  });
};

module.exports = {
  createTestUsers,
  createTestHotel,
  createTestRoom,
  createTestBooking,
};
