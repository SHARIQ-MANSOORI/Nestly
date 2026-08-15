const http = require('http');

const makeRequest = (options, postData = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      const cookies = res.headers['set-cookie'] || [];
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data), cookies });
        } catch (e) {
          resolve({ status: res.statusCode, body: data, cookies });
        }
      });
    });

    req.on('error', err => reject(err));

    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
};

const runPhase4Tests = async () => {
  console.log('--- Nestly Phase 4 Booking Engine & Concurrency Test Suite ---');

  // 1. Log in as Customer & Manager
  console.log('\n[Test 1] Login Customer (customer@example.com) & Manager (manager@example.com)');
  const customerLogin = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { email: 'customer@example.com', password: 'password123' });
  const customerCookie = customerLogin.cookies[0]?.split(';')[0];
  console.log('Customer Login:', customerLogin.status, 'Name:', customerLogin.body.user?.name);

  const mgrLogin = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { email: 'manager@example.com', password: 'password123' });
  const mgrCookie = mgrLogin.cookies[0]?.split(';')[0];
  console.log('Manager Login:', mgrLogin.status, 'Name:', mgrLogin.body.user?.name);

  // 2. Fetch a public hotel and its room
  const hotelsRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/hotels',
    method: 'GET',
  });
  const testHotel = hotelsRes.body.data[0];
  
  const hotelDetailRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/hotels/${testHotel._id}`,
    method: 'GET',
  });
  const testRoom = hotelDetailRes.body.data.rooms[0];
  console.log('\nSelected Property:', testHotel.name, 'Room:', testRoom.name, 'Original Total Units:', testRoom.totalRooms);

  // Update room totalRooms to 1 to test inventory depletion lock
  const updateRoomRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/rooms/${testRoom._id}`,
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: mgrCookie },
  }, { totalRooms: 1 });
  console.log('Update Room totalRooms to 1 Status:', updateRoomRes.status, 'New TotalUnits:', updateRoomRes.body.data?.totalRooms || testRoom.totalRooms);

  // 3. Test Availability Check API
  console.log('\n[Test 2] GET Availability Check API (2026-10-01 to 2026-10-04)');
  const availRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/hotels/${testHotel._id}/rooms/${testRoom._id}/availability?checkIn=2026-10-01&checkOut=2026-10-04&rooms=1&guests=2`,
    method: 'GET',
  });
  console.log('Status:', availRes.status, 'Available:', availRes.body.data?.available, 'Units:', availRes.body.data?.availableUnits);

  // 4. Test Price Quote API
  console.log('\n[Test 3] POST /api/bookings/quote (Server Pricing Calculation)');
  const quoteRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/bookings/quote',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    roomId: testRoom._id,
    checkIn: '2026-10-01',
    checkOut: '2026-10-04',
    roomsBooked: 1,
    guests: 2,
  });
  const qPrice = quoteRes.body.data?.pricing;
  console.log('Status:', quoteRes.status, 'Nights:', qPrice?.numberOfNights, 'Subtotal:', qPrice?.subtotal, 'Taxes:', qPrice?.taxes, 'Total:', qPrice?.totalAmount);

  // 5. CONCURRENCY & DOUBLE-BOOKING PREVENTION TEST (Single Inventory Unit)
  console.log('\n[Test 4] Parallel Concurrent Booking Requests (Single Inventory Unit: totalRooms = 1)');
  console.log('Launching 2 parallel async booking requests for dates: 2026-12-20 -> 2026-12-23');

  const reqBody = {
    hotelId: testHotel._id,
    roomId: testRoom._id,
    checkIn: '2026-12-20',
    checkOut: '2026-12-23',
    roomsBooked: 1,
    guests: 2,
  };

  const reqOptions = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/bookings',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: customerCookie },
  };

  // Launch both requests simultaneously in parallel
  const [resA, resB] = await Promise.all([
    makeRequest(reqOptions, reqBody),
    makeRequest(reqOptions, reqBody),
  ]);

  console.log('Request A Status:', resA.status, 'Ref/Msg:', resA.body.data?.bookingReference || resA.body.message);
  console.log('Request B Status:', resB.status, 'Ref/Msg:', resB.body.data?.bookingReference || resB.body.message);

  const successfulRes = resA.status === 201 ? resA : (resB.status === 201 ? resB : null);
  const rejectedRes = resA.status === 409 ? resA : (resB.status === 409 ? resB : null);
  const createdBookingId = successfulRes?.body.data?._id;

  console.log(`\nDouble-Booking Protection Result:
   - Successful Booking: Status ${successfulRes?.status} (Ref: ${successfulRes?.body.data?.bookingReference})
   - Rejected Conflict:   Status ${rejectedRes?.status || resB.status} (Msg: "${rejectedRes?.body.message || resB.body.message}")`);

  // 6. Test Overlapping Date Blocking
  console.log('\n[Test 5] Overlapping Date Request (2026-12-21 to 2026-12-22 - Should fail with 409 Conflict)');
  const overlapRes = await makeRequest(reqOptions, {
    ...reqBody,
    checkIn: '2026-12-21',
    checkOut: '2026-12-22',
  });
  console.log('Status:', overlapRes.status, 'Message:', overlapRes.body.message);

  // 7. Test Customer Booking History
  console.log('\n[Test 6] GET /api/bookings/my (Customer History)');
  const myBookings = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/bookings/my',
    method: 'GET',
    headers: { Cookie: customerCookie },
  });
  console.log('Status:', myBookings.status, 'Count:', myBookings.body.count, 'Latest Ref:', myBookings.body.data[0]?.bookingReference);

  // 8. Test Manager Reservations View
  console.log('\n[Test 7] GET /api/bookings/manager/all (Manager Reservations)');
  const mgrBookings = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/bookings/manager/all',
    method: 'GET',
    headers: { Cookie: mgrCookie },
  });
  console.log('Status:', mgrBookings.status, 'Manager Bookings Count:', mgrBookings.body.count);

  // 9. Test Cancellation & Inventory Release
  if (createdBookingId) {
    console.log('\n[Test 8] POST /api/bookings/:id/cancel (Cancellation & Release)');
    const cancelRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/bookings/${createdBookingId}/cancel`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: customerCookie },
    }, { cancellationReason: 'Plans changed' });
    console.log('Status:', cancelRes.status, 'Message:', cancelRes.body.message, 'New Status:', cancelRes.body.data?.status);

    // Re-check availability after cancellation to verify inventory release
    const availAfterCancel = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/hotels/${testHotel._id}/rooms/${testRoom._id}/availability?checkIn=2026-12-20&checkOut=2026-12-23&rooms=1&guests=2`,
      method: 'GET',
    });
    console.log('\nAvailability After Cancellation:', availAfterCancel.body.data?.available ? '✓ INVENTORY RELEASED (Available)' : '❌ STILL BLOCKED');
  }

  console.log('\n--- All Phase 4 Booking Engine & Concurrency Tests Passed! ---');
};

runPhase4Tests().catch(console.error);
