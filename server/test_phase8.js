/**
 * Nestly Phase 8 — Reviews, Ratings & Reputation Verification Suite
 */
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Hotel = require('./models/Hotel');
const Room = require('./models/Room');
const Booking = require('./models/Booking');
const Review = require('./models/Review');
const ReviewReport = require('./models/ReviewReport');

const reviewEligibilityService = require('./services/reviewEligibilityService');
const ratingService = require('./services/ratingService');
const reviewService = require('./services/reviewService');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nestly';

async function runPhase8Tests() {
  console.log('====================================================');
  console.log('  STARTING NESTLY PHASE 8 AUTOMATED TEST SUITE');
  console.log('====================================================\n');

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB Test Instance');

    // Cleanup existing test records
    await User.deleteMany({ email: /@phase8test\.com$/ });
    await Hotel.deleteMany({ name: /Phase8/ });
    await Room.deleteMany({ name: /Phase8/ });
    await Booking.deleteMany({ bookingReference: /^BK-P8-/ });

    // 1. Create Test Users: Manager, Customer 1, Customer 2, Admin
    const manager = await User.create({
      name: 'Manager P8',
      email: 'manager@phase8test.com',
      password: 'Password123!',
      role: 'manager',
    });

    const customer1 = await User.create({
      name: 'Customer 1 P8',
      email: 'customer1@phase8test.com',
      password: 'Password123!',
      role: 'customer',
    });

    const customer2 = await User.create({
      name: 'Customer 2 P8',
      email: 'customer2@phase8test.com',
      password: 'Password123!',
      role: 'customer',
    });

    const admin = await User.create({
      name: 'Admin P8',
      email: 'admin@phase8test.com',
      password: 'Password123!',
      role: 'admin',
    });

    console.log('✓ Test Accounts Provisioned (Manager, Customer 1, Customer 2, Admin)');

    // 2. Create Test Hotel & Room
    const hotel = await Hotel.create({
      name: 'Phase8 Luxury Grand Resort',
      description: 'Phase 8 test hotel for verified stay reviews.',
      owner: manager._id,
      location: 'Beach Road, Goa',
      city: 'Goa',
      country: 'India',
      images: ['https://example.com/hotel.jpg'],
      amenities: ['Pool', 'WiFi', 'Spa'],
    });

    const room = await Room.create({
      hotel: hotel._id,
      name: 'Phase8 Executive Ocean Suite',
      description: 'Phase 8 luxury suite with ocean view.',
      type: 'Deluxe',
      pricePerNight: 5000,
      capacity: 2,
      totalRooms: 5,
    });

    console.log('✓ Test Hotel & Room Provisioned');

    // 3. Create Test Bookings
    // Booking 1: Future check-out (Not eligible yet)
    const futureCheckOut = new Date();
    futureCheckOut.setDate(futureCheckOut.getDate() + 3);

    const bookingFuture = await Booking.create({
      bookingReference: 'BK-P8-FUTURE',
      user: customer1._id,
      hotel: hotel._id,
      room: room._id,
      checkIn: new Date(),
      checkOut: futureCheckOut,
      guests: 2,
      roomsBooked: 1,
      numberOfNights: 3,
      pricePerNight: 5000,
      subtotal: 15000,
      taxes: 1800,
      totalAmount: 16800,
      status: 'confirmed',
      paymentStatus: 'paid',
    });

    // Booking 2: Past check-out (Completed & Eligible)
    const pastCheckIn = new Date();
    pastCheckIn.setDate(pastCheckIn.getDate() - 5);
    const pastCheckOut = new Date();
    pastCheckOut.setDate(pastCheckOut.getDate() - 2);

    const bookingCompleted1 = await Booking.create({
      bookingReference: 'BK-P8-COMPLETED1',
      user: customer1._id,
      hotel: hotel._id,
      room: room._id,
      checkIn: pastCheckIn,
      checkOut: pastCheckOut,
      guests: 2,
      roomsBooked: 1,
      numberOfNights: 3,
      pricePerNight: 5000,
      subtotal: 15000,
      taxes: 1800,
      totalAmount: 16800,
      status: 'completed',
      paymentStatus: 'paid',
    });

    // Booking 3: Second Past Completed Stay for Customer 2
    const bookingCompleted2 = await Booking.create({
      bookingReference: 'BK-P8-COMPLETED2',
      user: customer2._id,
      hotel: hotel._id,
      room: room._id,
      checkIn: pastCheckIn,
      checkOut: pastCheckOut,
      guests: 2,
      roomsBooked: 1,
      numberOfNights: 3,
      pricePerNight: 5000,
      subtotal: 15000,
      taxes: 1800,
      totalAmount: 16800,
      status: 'completed',
      paymentStatus: 'paid',
    });

    console.log('✓ Test Reservations Provisioned');

    // ----------------------------------------------------
    // TEST 1: Verified Stay Eligibility Verification
    // ----------------------------------------------------
    console.log('\n--- TEST 1: Verified Stay Eligibility ---');
    const futureEligibility = await reviewEligibilityService.checkReviewEligibility(bookingFuture._id, customer1._id);
    if (!futureEligibility.eligible && futureEligibility.reason === 'CHECKOUT_NOT_REACHED') {
      console.log('✓ PASS: Future stay check-out not reached -> Properly rejected review eligibility');
    } else {
      throw new Error(`FAIL: Future stay eligibility check failed: ${JSON.stringify(futureEligibility)}`);
    }

    const completedEligibility = await reviewEligibilityService.checkReviewEligibility(bookingCompleted1._id, customer1._id);
    if (completedEligibility.eligible) {
      console.log('✓ PASS: Completed stay -> Verified stay review eligibility approved');
    } else {
      throw new Error(`FAIL: Completed stay eligibility failed: ${JSON.stringify(completedEligibility)}`);
    }

    // ----------------------------------------------------
    // TEST 2: Submit Verified Review & Check Aggregate Ratings
    // ----------------------------------------------------
    console.log('\n--- TEST 2: Submit Verified Review & Aggregations ---');
    const review1 = await reviewService.createReview(
      customer1._id,
      bookingCompleted1._id,
      5,
      'Stunning Luxury Experience!',
      'The ocean suite was immaculately clean and service was top-notch.',
      { cleanliness: 5, location: 5, service: 5, value: 4 }
    );
    console.log(`✓ PASS: Created 5★ Review ID ${review1._id}`);

    // Verify rating recalculation on Hotel
    let updatedHotel = await Hotel.findById(hotel._id);
    if (updatedHotel.averageRating === 5 && updatedHotel.reviewCount === 1 && updatedHotel.ratingBreakdown[5] === 1) {
      console.log('✓ PASS: Hotel rating updated to 5.0★ (1 Review, 100% 5-star distribution)');
    } else {
      throw new Error(`FAIL: Rating aggregation failed: averageRating=${updatedHotel.averageRating}, reviewCount=${updatedHotel.reviewCount}`);
    }

    // ----------------------------------------------------
    // TEST 3: One Review Per Booking Guard (Unique Index)
    // ----------------------------------------------------
    console.log('\n--- TEST 3: Unique Booking Constraint Guard ---');
    try {
      await reviewService.createReview(
        customer1._id,
        bookingCompleted1._id,
        4,
        'Duplicate Attempt',
        'Trying to review twice.'
      );
      throw new Error('FAIL: Allowed duplicate review for same booking');
    } catch (err) {
      if (err.message.includes('already submitted') || err.code === 11000) {
        console.log('✓ PASS: Blocked duplicate review attempt for same reservation ID');
      } else {
        throw err;
      }
    }

    // ----------------------------------------------------
    // TEST 4: Second Review & Combined Rating Aggregation
    // ----------------------------------------------------
    console.log('\n--- TEST 4: Multiple Reviews Aggregation ---');
    const review2 = await reviewService.createReview(
      customer2._id,
      bookingCompleted2._id,
      3,
      'Average Stay',
      'Location was nice but check-in process took too long.',
      { cleanliness: 4, location: 4, service: 2, value: 3 }
    );

    updatedHotel = await Hotel.findById(hotel._id);
    // (5 + 3) / 2 = 4.0 average rating
    if (updatedHotel.averageRating === 4 && updatedHotel.reviewCount === 2) {
      console.log(`✓ PASS: Recalculated Hotel Rating: ${updatedHotel.averageRating}★ across ${updatedHotel.reviewCount} Reviews (5★: ${updatedHotel.ratingBreakdown[5]}, 3★: ${updatedHotel.ratingBreakdown[3]})`);
    } else {
      throw new Error(`FAIL: Rating aggregation mismatch: averageRating=${updatedHotel.averageRating}, reviewCount=${updatedHotel.reviewCount}`);
    }

    // ----------------------------------------------------
    // TEST 5: Hotel Manager Response
    // ----------------------------------------------------
    console.log('\n--- TEST 5: Hotel Manager Official Response ---');
    const respondedReview = await reviewService.postManagerResponse(
      manager._id,
      review2._id,
      'Thank you for your constructive feedback. We have streamlined our front desk staff to shorten check-in times.'
    );

    if (respondedReview.managerResponse?.comment.includes('front desk staff')) {
      console.log('✓ PASS: Manager response recorded successfully under guest review');
    } else {
      throw new Error('FAIL: Manager response was not recorded');
    }

    // ----------------------------------------------------
    // TEST 6: Abuse Reporting & Admin Moderation Action
    // ----------------------------------------------------
    console.log('\n--- TEST 6: User Abuse Report & Admin Moderation ---');
    const report = await reviewService.reportReview(
      customer1._id,
      review2._id,
      'spam',
      'Inappropriate comment details'
    );
    console.log(`✓ PASS: User filed report ID ${report._id} against review ID ${review2._id}`);

    const pendingReports = await reviewService.getAdminReports();
    if (pendingReports.length > 0) {
      console.log(`✓ PASS: Admin moderation queue retrieved ${pendingReports.length} pending report(s)`);
    } else {
      throw new Error('FAIL: Admin reports queue was empty');
    }

    // Admin resolves report by hiding review
    await reviewService.resolveAdminReport(admin._id, report._id, 'action_taken');

    const hiddenReview = await Review.findById(review2._id);
    if (hiddenReview.status === 'hidden') {
      console.log('✓ PASS: Admin hidden inappropriate review status');
    } else {
      throw new Error(`FAIL: Review status was ${hiddenReview.status}`);
    }

    // Check hotel rating after review is hidden (Only 5★ review remains published -> Rating back to 5.0★)
    updatedHotel = await Hotel.findById(hotel._id);
    if (updatedHotel.averageRating === 5 && updatedHotel.reviewCount === 1) {
      console.log('✓ PASS: Hotel rating updated after moderation: Hidden review excluded from aggregate (5.0★, 1 Review)');
    } else {
      throw new Error(`FAIL: Post-moderation rating calculation failed: ${updatedHotel.averageRating}`);
    }

    // ----------------------------------------------------
    // Clean Up Test Records
    // ----------------------------------------------------
    await User.deleteMany({ email: /@phase8test\.com$/ });
    await Hotel.deleteMany({ name: /Phase8/ });
    await Room.deleteMany({ name: /Phase8/ });
    await Booking.deleteMany({ bookingReference: /^BK-P8-/ });
    await Review.deleteMany({ comment: / ocean suite / });
    await ReviewReport.deleteMany({});

    console.log('\n====================================================');
    console.log('  ALL NESTLY PHASE 8 AUTOMATED TESTS PASSED 100%');
    console.log('====================================================\n');
  } catch (error) {
    console.error('\n❌ NESTLY PHASE 8 TEST FAILED:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runPhase8Tests();
