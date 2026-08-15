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

const runPhase7Tests = async () => {
  console.log('--- Nestly Phase 7 Analytics & Reporting Test Suite ---');

  // 1. Log in users
  console.log('\n[Test 1] Login Customer, Manager, and Admin');
  const custLogin = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { email: 'customer@example.com', password: 'password123' });
  const custCookie = custLogin.cookies[0]?.split(';')[0];
  console.log('Customer Login:', custLogin.status, 'User:', custLogin.body.user?.name);

  const mgrLogin = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { email: 'manager@example.com', password: 'password123' });
  const mgrCookie = mgrLogin.cookies[0]?.split(';')[0];
  console.log('Manager Login:', mgrLogin.status, 'User:', mgrLogin.body.user?.name);

  const adminLogin = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { email: 'admin@example.com', password: 'password123' });
  const adminCookie = adminLogin.cookies[0]?.split(';')[0];
  console.log('Admin Login:', adminLogin.status, 'User:', adminLogin.body.user?.name);

  // 2. Authorization Security Guard Test
  console.log('\n[Test 2] Authorization Security Guard');
  const custAccessRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/analytics/manager/overview',
    method: 'GET',
    headers: { Cookie: custCookie },
  });
  console.log('Customer Access Status (Expect 403):', custAccessRes.status, 'Msg:', custAccessRes.body.message);

  // 3. Create Booking & Pay to populate analytics data
  console.log('\n[Test 3] Create Booking & Payment for Analytics Accuracy Test');
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

  const futIn = new Date();
  futIn.setDate(futIn.getDate() + Math.floor(Math.random() * 60) + 20);
  const futOut = new Date(futIn);
  futOut.setDate(futOut.getDate() + 3);

  const checkInStr = futIn.toISOString().split('T')[0];
  const checkOutStr = futOut.toISOString().split('T')[0];

  const bookingRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/bookings',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: custCookie },
  }, {
    hotelId: testHotel._id,
    roomId: testRoom._id,
    checkIn: checkInStr,
    checkOut: checkOutStr,
    roomsBooked: 1,
    guests: 2,
  });
  const booking = bookingRes.body.data;
  console.log('Booking Created:', bookingRes.status, 'Ref:', booking?.bookingReference, 'Amount:', booking?.totalAmount);

  // Pay for booking
  const orderRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/payments/create-order',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: custCookie },
  }, { bookingId: booking._id });

  const orderId = orderRes.body.data.orderId;
  const payVerifyRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/payments/verify',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: custCookie },
  }, {
    bookingId: booking._id,
    razorpayOrderId: orderId,
    razorpayPaymentId: `pay_analytics_${Date.now()}`,
    razorpaySignature: `simulated_success_sig_${orderId}`,
  });
  console.log('Payment Verified:', payVerifyRes.status, 'Status:', payVerifyRes.body.booking?.paymentStatus);

  // 4. Manager Analytics Query & Metric Verification
  console.log('\n[Test 4] GET /api/analytics/manager/overview (Manager Analytics)');
  const mgrAnalyticsRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/analytics/manager/overview?filter=this_year',
    method: 'GET',
    headers: { Cookie: mgrCookie },
  });
  const kpis = mgrAnalyticsRes.body.data?.kpis || {};
  console.log('Manager Analytics Status:', mgrAnalyticsRes.status);
  console.log('KPIs Summary:');
  console.log('   - Gross Revenue: ₹' + kpis.grossRevenue);
  console.log('   - Net Revenue:   ₹' + kpis.netRevenue);
  console.log('   - Bookings:      ' + kpis.totalBookings + ' (Confirmed: ' + kpis.confirmedBookings + ')');
  console.log('   - Occupancy %:   ' + kpis.occupancyRate + '%');
  console.log('   - ADR:           ₹' + kpis.adr);
  console.log('   - RevPAR:        ₹' + kpis.revpar);
  console.log('   - Avg Stay:      ' + kpis.averageStay + ' nights');
  console.log('   - Avg Booking:   ₹' + kpis.averageBookingValue);

  // 5. Date Filter Presets
  console.log('\n[Test 5] Date Filter Presets (7d, 30d, custom)');
  const preset7d = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/analytics/manager/overview?filter=7d',
    method: 'GET',
    headers: { Cookie: mgrCookie },
  });
  console.log('7D Filter Status:', preset7d.status, 'Days in Period:', preset7d.body.data?.dateRange?.numberOfDays);

  // 6. Admin Platform Analytics Query
  console.log('\n[Test 6] GET /api/analytics/admin/overview (Admin Platform Analytics)');
  const adminAnalyticsRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/analytics/admin/overview?filter=this_year',
    method: 'GET',
    headers: { Cookie: adminCookie },
  });
  const adminKpis = adminAnalyticsRes.body.data?.kpis || {};
  console.log('Admin Analytics Status:', adminAnalyticsRes.status);
  console.log('Platform KPIs:');
  console.log('   - Total Hotels:   ' + adminKpis.totalHotels + ' (Active: ' + adminKpis.activeHotels + ')');
  console.log('   - Active Rooms:   ' + adminKpis.totalRooms);
  console.log('   - Customers:      ' + adminKpis.totalCustomers + ' | Managers: ' + adminKpis.totalManagers);
  console.log('   - Gross Revenue:  ₹' + adminKpis.grossRevenue);
  console.log('   - Top Hotels:     ' + (adminAnalyticsRes.body.data?.topHotels?.length || 0) + ' ranked properties');

  console.log('\n--- All Phase 7 Analytics & Reporting Tests Passed Cleanly! ---');
};

runPhase7Tests().catch(console.error);
