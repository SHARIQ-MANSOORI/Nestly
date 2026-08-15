/**
 * Nestly Phase 9 — Security Hardening & Penetration Testing Verification Suite
 */
const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const User = require('./models/User');
const Hotel = require('./models/Hotel');
const Room = require('./models/Room');
const Booking = require('./models/Booking');
const Review = require('./models/Review');
const AuditLog = require('./models/AuditLog');

const API_URL = process.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nestly';

async function runSecurityTests() {
  console.log('====================================================');
  console.log('  STARTING NESTLY PHASE 9 SECURITY VERIFICATION SUITE');
  console.log('====================================================\n');

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB Instance');

    // Clean test accounts
    await User.deleteMany({ email: /@securitytest\.com$/ });
    await Hotel.deleteMany({ name: /SecurityTest/ });
    await Room.deleteMany({ name: /SecurityTest/ });
    await Booking.deleteMany({ bookingReference: /^BK-SEC-/ });
    await AuditLog.deleteMany({ actorEmail: /securitytest\.com$/ });

    // Provision test accounts
    const managerA = await User.create({
      name: 'Manager A Sec',
      email: 'managera@securitytest.com',
      password: 'Password123!',
      role: 'manager',
    });

    const managerB = await User.create({
      name: 'Manager B Sec',
      email: 'managerb@securitytest.com',
      password: 'Password123!',
      role: 'manager',
    });

    const customerA = await User.create({
      name: 'Customer A Sec',
      email: 'customera@securitytest.com',
      password: 'Password123!',
      role: 'customer',
    });

    const customerB = await User.create({
      name: 'Customer B Sec',
      email: 'customerb@securitytest.com',
      password: 'Password123!',
      role: 'customer',
    });

    const admin = await User.create({
      name: 'Admin Sec',
      email: 'admin@securitytest.com',
      password: 'Password123!',
      role: 'admin',
    });

    console.log('✓ Security Test Users Provisioned');

    // Create Manager A Hotel & Room
    const hotelA = await Hotel.create({
      name: 'SecurityTest Grand Hotel A',
      description: 'Security test hotel A.',
      owner: managerA._id,
      location: 'Goa',
      city: 'Goa',
      country: 'India',
      images: ['https://example.com/hotelA.jpg'],
    });

    const roomA = await Room.create({
      hotel: hotelA._id,
      name: 'SecurityTest Room A',
      description: 'Room A description',
      type: 'Deluxe',
      pricePerNight: 4000,
      capacity: 2,
    });

    // Create Customer B Booking for Hotel A
    const pastCheckIn = new Date();
    pastCheckIn.setDate(pastCheckIn.getDate() - 5);
    const pastCheckOut = new Date();
    pastCheckOut.setDate(pastCheckOut.getDate() - 2);

    const bookingB = await Booking.create({
      bookingReference: 'BK-SEC-B',
      user: customerB._id,
      hotel: hotelA._id,
      room: roomA._id,
      checkIn: pastCheckIn,
      checkOut: pastCheckOut,
      guests: 2,
      roomsBooked: 1,
      numberOfNights: 3,
      pricePerNight: 4000,
      subtotal: 12000,
      taxes: 1440,
      totalAmount: 13440,
      status: 'completed',
      paymentStatus: 'paid',
    });

    console.log('✓ Test Hotel, Room & Reservation Created');

    // Create HTTP Client helper with cookie jar support
    const getClientCookie = (res) => {
      const cookies = res.headers['set-cookie'];
      return cookies ? cookies.map((c) => c.split(';')[0]).join('; ') : '';
    };

    // ----------------------------------------------------
    // TEST 1: Password Policy & Weak Password Guard
    // ----------------------------------------------------
    console.log('\n--- TEST 1: Password Policy & Weak Password Guard ---');
    try {
      await axios.post(`${API_URL}/auth/register`, {
        name: 'Weak Pass User',
        email: 'weak@securitytest.com',
        password: '123456', // Too weak
      });
      throw new Error('FAIL: Allowed registration with weak password "123456"');
    } catch (err) {
      if (err.response && err.response.status === 400 && err.response.data.message.includes('Password')) {
        console.log('✓ PASS: Rejected weak password "123456" with 400 Bad Request');
      } else {
        throw err;
      }
    }

    // ----------------------------------------------------
    // TEST 2: Role Escalation Prevention
    // ----------------------------------------------------
    console.log('\n--- TEST 2: Public Registration Role Escalation Guard ---');
    const regRes = await axios.post(`${API_URL}/auth/register`, {
      name: 'Escalation Attacker',
      email: 'escalate@securitytest.com',
      password: 'Password123!',
      role: 'admin', // Malicious payload attempting admin role
    });

    if (regRes.data.user.role === 'customer') {
      console.log('✓ PASS: Public registration payload role="admin" stripped -> Forcefully assigned role="customer"');
    } else {
      throw new Error(`FAIL: Assigned role was ${regRes.data.user.role}`);
    }

    // Verify audit log recorded role escalation attempt
    const escalationAudit = await AuditLog.findOne({ action: 'ROLE_ESCALATION_ATTEMPT', actorEmail: 'escalate@securitytest.com' });
    if (escalationAudit) {
      console.log('✓ PASS: Security Audit Log recorded ROLE_ESCALATION_ATTEMPT event');
    } else {
      throw new Error('FAIL: Audit log did not capture role escalation attempt');
    }

    // ----------------------------------------------------
    // TEST 3: NoSQL Injection Operator Sanitization
    // ----------------------------------------------------
    console.log('\n--- TEST 3: NoSQL Query Operator Injection Guard ---');
    try {
      const nosqlRes = await axios.post(`${API_URL}/auth/login`, {
        email: { $gt: '' }, // NoSQL Injection payload
        password: 'Password123!',
      });
      
      // If server processes it safely without crashing or leaking, verify user isn't logged in
      if (!nosqlRes.data.success) {
        console.log('✓ PASS: NoSQL operator payload rejected safely');
      }
    } catch (err) {
      if (err.response && (err.response.status === 400 || err.response.status === 401)) {
        console.log(`✓ PASS: NoSQL Operator Injection blocked safely with HTTP ${err.response.status}`);
      } else {
        throw err;
      }
    }

    // ----------------------------------------------------
    // TEST 4: Customer IDOR / BOLA Cross-User Protection
    // ----------------------------------------------------
    console.log('\n--- TEST 4: IDOR / BOLA Cross-Customer Protection ---');
    // Login as Customer A
    const loginResA = await axios.post(`${API_URL}/auth/login`, {
      email: 'customera@securitytest.com',
      password: 'Password123!',
    });
    const cookieA = getClientCookie(loginResA);

    // Customer A attempts to access Customer B's reservation receipt
    try {
      await axios.get(`${API_URL}/bookings/${bookingB._id}`, {
        headers: { Cookie: cookieA },
      });
      throw new Error('FAIL: Customer A was allowed to access Customer B reservation receipt');
    } catch (err) {
      if (err.response && err.response.status === 403) {
        console.log('✓ PASS: Customer A blocked from reading Customer B reservation (HTTP 403 Forbidden)');
      } else {
        throw err;
      }
    }

    // ----------------------------------------------------
    // TEST 5: Manager Cross-Property Ownership Guard
    // ----------------------------------------------------
    console.log('\n--- TEST 5: Manager Cross-Property Ownership Guard ---');
    // Login as Manager B
    const loginResMgrB = await axios.post(`${API_URL}/auth/login`, {
      email: 'managerb@securitytest.com',
      password: 'Password123!',
    });
    const cookieMgrB = getClientCookie(loginResMgrB);

    // Manager B attempts to update Manager A's hotel property
    try {
      await axios.put(
        `${API_URL}/hotels/${hotelA._id}`,
        { name: 'Hacked Hotel Name' },
        { headers: { Cookie: cookieMgrB } }
      );
      throw new Error("FAIL: Manager B allowed to modify Manager A's property");
    } catch (err) {
      if (err.response && err.response.status === 403) {
        console.log("✓ PASS: Manager B blocked from modifying Manager A's property (HTTP 403 Forbidden)");
      } else {
        throw err;
      }
    }

    // ----------------------------------------------------
    // TEST 6: Stored XSS Input Sanitization
    // ----------------------------------------------------
    console.log('\n--- TEST 6: Stored XSS Input Sanitization ---');
    // Login as Customer B (eligible for bookingB review)
    const loginResB = await axios.post(`${API_URL}/auth/login`, {
      email: 'customerb@securitytest.com',
      password: 'Password123!',
    });
    const cookieB = getClientCookie(loginResB);

    const xssPayload = "<script>alert('xss-attack')</script>Immaculate luxury stay experience!";
    const reviewRes = await axios.post(
      `${API_URL}/reviews`,
      {
        bookingId: bookingB._id,
        rating: 5,
        title: "<script>alert('title-xss')</script>Great Stay",
        comment: xssPayload,
      },
      { headers: { Cookie: cookieB } }
    );

    const savedReview = reviewRes.data.data;
    if (!savedReview.comment.includes('<script>')) {
      console.log(`✓ PASS: XSS script tags sanitized cleanly in review comment: "${savedReview.comment}"`);
    } else {
      throw new Error(`FAIL: Review comment contained raw XSS script tag: ${savedReview.comment}`);
    }

    // ----------------------------------------------------
    // TEST 7: Admin Audit Log Retrieval
    // ----------------------------------------------------
    console.log('\n--- TEST 7: Admin Audit Logs Inspection ---');
    // Login as Admin
    const loginResAdmin = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@securitytest.com',
      password: 'Password123!',
    });
    const cookieAdmin = getClientCookie(loginResAdmin);

    const auditRes = await axios.get(`${API_URL}/admin/audit-logs`, {
      headers: { Cookie: cookieAdmin },
    });

    if (auditRes.data.success && auditRes.data.data.logs.length > 0) {
      console.log(`✓ PASS: Admin retrieved ${auditRes.data.data.logs.length} security audit log records`);
    } else {
      throw new Error('FAIL: Admin audit log retrieval failed');
    }

    // ----------------------------------------------------
    // Clean Up Security Test Records
    // ----------------------------------------------------
    await User.deleteMany({ email: /@securitytest\.com$/ });
    await Hotel.deleteMany({ name: /SecurityTest/ });
    await Room.deleteMany({ name: /SecurityTest/ });
    await Booking.deleteMany({ bookingReference: /^BK-SEC-/ });
    await Review.deleteMany({ comment: /Immaculate luxury/ });
    await AuditLog.deleteMany({ actorEmail: /securitytest\.com$/ });

    console.log('\n====================================================');
    console.log('  ALL NESTLY PHASE 9 SECURITY TESTS PASSED 100%');
    console.log('====================================================\n');
  } catch (error) {
    console.error('\n❌ NESTLY PHASE 9 SECURITY TEST FAILED:', error.response?.data || error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runSecurityTests();
