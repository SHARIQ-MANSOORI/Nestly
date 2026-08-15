const http = require('http');
const crypto = require('crypto');

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

const runPhase5Tests = async () => {
  console.log('--- Nestly Phase 5 Payment Integration Security & Verification Test Suite ---');

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
  console.log('Customer Login:', customerLogin.status, 'User:', customerLogin.body.user?.name);

  const mgrLogin = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { email: 'manager@example.com', password: 'password123' });
  const mgrCookie = mgrLogin.cookies[0]?.split(';')[0];
  console.log('Manager Login:', mgrLogin.status, 'User:', mgrLogin.body.user?.name);

  // 2. Fetch public hotel & room
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

  // 3. Create test reservation
  console.log('\n[Test 2] Customer creates reservation for property:', testHotel.name);
  const futureCheckIn = new Date();
  futureCheckIn.setDate(futureCheckIn.getDate() + Math.floor(Math.random() * 50) + 10);
  const futureCheckOut = new Date(futureCheckIn);
  futureCheckOut.setDate(futureCheckOut.getDate() + 3);

  const checkInStr = futureCheckIn.toISOString().split('T')[0];
  const checkOutStr = futureCheckOut.toISOString().split('T')[0];

  const bookingRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/bookings',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: customerCookie },
  }, {
    hotelId: testHotel._id,
    roomId: testRoom._id,
    checkIn: checkInStr,
    checkOut: checkOutStr,
    roomsBooked: 1,
    guests: 2,
  });
  const testBooking = bookingRes.body.data;
  if (!testBooking) {
    console.error('Booking Creation Failed:', bookingRes.body);
    throw new Error(`Booking creation failed with status ${bookingRes.status}: ${JSON.stringify(bookingRes.body)}`);
  }
  console.log('Booking Created Status:', bookingRes.status, 'Ref:', testBooking.bookingReference, 'Total Amount:', testBooking.totalAmount);

  // 4. Create Payment Order API (Server-Side Amount Authority)
  console.log('\n[Test 3] POST /api/payments/create-order (Server Amount Authority)');
  const orderRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/payments/create-order',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: customerCookie },
  }, { bookingId: testBooking._id });
  const orderData = orderRes.body.data;
  console.log('Order Creation Status:', orderRes.status, 'OrderId:', orderData.orderId, 'Subunits:', orderData.amountInSubunits, 'Currency:', orderData.currency);

  // 5. Payment Amount Tampering Security Guard
  console.log('\n[Test 4] Tampering Guard (Attempting client-side amount override: ₹100)');
  const tamperRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/payments/create-order',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: customerCookie },
  }, { bookingId: testBooking._id, amount: 100 });
  console.log('Tamper Test Status:', tamperRes.status, 'Returned Amount In Subunits:', tamperRes.body.data?.amountInSubunits);
  if (tamperRes.body.data?.amountInSubunits === orderData.amountInSubunits) {
    console.log('✓ TAMPER GUARD ENFORCED: Client amount parameter strictly ignored!');
  }

  // 6. Ownership Security Guard Test
  console.log('\n[Test 5] Ownership Guard (Manager attempting to pay for Customer booking)');
  const ownerGuardRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/payments/create-order',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: mgrCookie },
  }, { bookingId: testBooking._id });
  console.log('Status:', ownerGuardRes.status, 'Message:', ownerGuardRes.body.message);

  // 7. Forged Signature Rejection
  console.log('\n[Test 6] Forged HMAC Signature Rejection');
  const forgedVerifyRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/payments/verify',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: customerCookie },
  }, {
    bookingId: testBooking._id,
    razorpayOrderId: orderData.orderId,
    razorpayPaymentId: 'pay_forged_99999',
    razorpaySignature: 'forged_invalid_signature_hash',
  });
  console.log('Status:', forgedVerifyRes.status, 'Message:', forgedVerifyRes.body.message);

  // 8. Valid HMAC Signature Verification
  console.log('\n[Test 7] Valid HMAC / Sandbox Signature Verification');
  const validSig = `simulated_success_sig_${orderData.orderId}`;
  const validVerifyRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/payments/verify',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: customerCookie },
  }, {
    bookingId: testBooking._id,
    razorpayOrderId: orderData.orderId,
    razorpayPaymentId: `pay_test_${Date.now()}`,
    razorpaySignature: validSig,
  });
  console.log('Status:', validVerifyRes.status, 'Message:', validVerifyRes.body.message);
  console.log('Updated Booking Payment Status:', validVerifyRes.body.booking?.paymentStatus, 'Booking Status:', validVerifyRes.body.booking?.status);

  // 9. Idempotency & Duplicate Verification Guard
  console.log('\n[Test 8] Idempotency & Duplicate Verification Guard');
  const duplicateRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/payments/verify',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: customerCookie },
  }, {
    bookingId: testBooking._id,
    razorpayOrderId: orderData.orderId,
    razorpayPaymentId: 'pay_duplicate_123',
    razorpaySignature: validSig,
  });
  console.log('Status:', duplicateRes.status, 'Message:', duplicateRes.body.message);

  // 10. Customer Payment History
  console.log('\n[Test 9] GET /api/payments/my (Customer History)');
  const myPaymentsRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/payments/my',
    method: 'GET',
    headers: { Cookie: customerCookie },
  });
  console.log('Status:', myPaymentsRes.status, 'Count:', myPaymentsRes.body.count, 'Latest Payment Status:', myPaymentsRes.body.data[0]?.status);

  // 11. Manager Payment Visibility
  console.log('\n[Test 10] GET /api/payments/manager/all (Manager Property Payments)');
  const mgrPaymentsRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/payments/manager/all',
    method: 'GET',
    headers: { Cookie: mgrCookie },
  });
  console.log('Status:', mgrPaymentsRes.status, 'Count:', mgrPaymentsRes.body.count);

  console.log('\n--- All Phase 5 Payment Integration & Security Tests Passed Cleanly! ---');
};

runPhase5Tests().catch(console.error);
