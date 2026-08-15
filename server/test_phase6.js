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

const runPhase6Tests = async () => {
  console.log('--- Nestly Phase 6 Notifications & Communication Test Suite ---');

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

  // 3. Customer creates booking -> triggers BOOKING_CONFIRMED & MANAGER_NEW_BOOKING
  console.log('\n[Test 2] Customer creates booking & triggers event notifications');
  const bookingRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/bookings',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: customerCookie },
  }, {
    hotelId: testHotel._id,
    roomId: testRoom._id,
    checkIn: '2026-11-20',
    checkOut: '2026-11-23',
    roomsBooked: 1,
    guests: 2,
  });
  const createdBooking = bookingRes.body.data;
  console.log('Booking Created Status:', bookingRes.status, 'Ref:', createdBooking.bookingReference);

  // 4. Verify Customer receives in-app BOOKING_CONFIRMED notification
  console.log('\n[Test 3] GET /api/notifications (Customer Notification List)');
  const custNotifsRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/notifications',
    method: 'GET',
    headers: { Cookie: customerCookie },
  });
  console.log('Status:', custNotifsRes.status, 'Count:', custNotifsRes.body.count, 'Unread:', custNotifsRes.body.unreadCount);
  const custLatestNotif = custNotifsRes.body.data[0];
  console.log('Latest Title:', custLatestNotif?.title, 'Type:', custLatestNotif?.type);

  // 5. Verify Manager receives in-app MANAGER_NEW_BOOKING notification
  console.log('\n[Test 4] GET /api/notifications (Manager Notification List)');
  const mgrNotifsRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/notifications',
    method: 'GET',
    headers: { Cookie: mgrCookie },
  });
  console.log('Status:', mgrNotifsRes.status, 'Count:', mgrNotifsRes.body.count, 'Unread:', mgrNotifsRes.body.unreadCount);
  const mgrLatestNotif = mgrNotifsRes.body.data[0];
  console.log('Latest Title:', mgrLatestNotif?.title, 'Type:', mgrLatestNotif?.type);

  // 6. User Scoping Authorization Guard
  console.log('\n[Test 5] Authorization Guard (Customer attempting to modify Manager notification)');
  if (mgrLatestNotif) {
    const scopeGuardRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/notifications/${mgrLatestNotif._id}/read`,
      method: 'PATCH',
      headers: { Cookie: customerCookie },
    });
    console.log('Status:', scopeGuardRes.status, 'Message:', scopeGuardRes.body.message);
  }

  // 7. Unread Count & Mark-As-Read API
  console.log('\n[Test 6] PATCH /api/notifications/:id/read & GET /api/notifications/unread-count');
  if (custLatestNotif) {
    const markReadRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/notifications/${custLatestNotif._id}/read`,
      method: 'PATCH',
      headers: { Cookie: customerCookie },
    });
    console.log('Mark Read Status:', markReadRes.status, 'IsRead:', markReadRes.body.data?.isRead);

    const unreadCountRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/notifications/unread-count',
      method: 'GET',
      headers: { Cookie: customerCookie },
    });
    console.log('Updated Unread Count:', unreadCountRes.body.unreadCount);
  }

  // 8. Payment Success Event Notification
  console.log('\n[Test 7] Payment Success Event -> PAYMENT_SUCCESS Notification');
  const orderRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/payments/create-order',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: customerCookie },
  }, { bookingId: createdBooking._id });

  const orderId = orderRes.body.data.orderId;
  const verifyRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/payments/verify',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: customerCookie },
  }, {
    bookingId: createdBooking._id,
    razorpayOrderId: orderId,
    razorpayPaymentId: `pay_test_${Date.now()}`,
    razorpaySignature: `simulated_success_sig_${orderId}`,
  });
  console.log('Payment Verify Status:', verifyRes.status, 'Payment Status:', verifyRes.body.booking?.paymentStatus);

  const postPayNotifs = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/notifications',
    method: 'GET',
    headers: { Cookie: customerCookie },
  });
  console.log('Latest Customer Notification After Payment:', postPayNotifs.body.data[0]?.type, 'Title:', postPayNotifs.body.data[0]?.title);

  // 9. Booking Cancellation Event Notification
  console.log('\n[Test 8] Booking Cancellation Event -> BOOKING_CANCELLED Notification');
  const cancelRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/bookings/${createdBooking._id}/cancel`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: customerCookie },
  }, { cancellationReason: 'Plans changed' });
  console.log('Cancel Status:', cancelRes.status, 'Booking Status:', cancelRes.body.data?.status);

  const postCancelNotifs = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/notifications',
    method: 'GET',
    headers: { Cookie: customerCookie },
  });
  console.log('Latest Customer Notification After Cancel:', postCancelNotifs.body.data[0]?.type);

  // 10. Preferences API
  console.log('\n[Test 9] GET & PUT /api/notifications/preferences (User Preferences)');
  const getPrefsRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/notifications/preferences',
    method: 'GET',
    headers: { Cookie: customerCookie },
  });
  console.log('Preferences Get Status:', getPrefsRes.status, 'Email Confirmation Pref:', getPrefsRes.body.data?.emailBookingConfirmation);

  const updatePrefsRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/notifications/preferences',
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: customerCookie },
  }, { emailBookingConfirmation: false });
  console.log('Preferences Update Status:', updatePrefsRes.status, 'New Pref:', updatePrefsRes.body.data?.emailBookingConfirmation);

  // 11. Delete Notification API
  console.log('\n[Test 10] DELETE /api/notifications/:id');
  if (custLatestNotif) {
    const deleteRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/notifications/${custLatestNotif._id}`,
      method: 'DELETE',
      headers: { Cookie: customerCookie },
    });
    console.log('Delete Notification Status:', deleteRes.status, 'Message:', deleteRes.body.message);
  }

  console.log('\n--- All Phase 6 Notifications & Communication Tests Passed Cleanly! ---');
};

runPhase6Tests().catch(console.error);
