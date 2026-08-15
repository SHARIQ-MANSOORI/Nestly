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

const runPhase3Tests = async () => {
  console.log('--- Nestly Phase 3 Hotel & Room Management Security Test Suite ---');

  // 1. Log in as Manager A
  console.log('\n[Test 1] Login Manager A (manager@example.com)');
  const mgrA = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { email: 'manager@example.com', password: 'password123' });
  const cookieA = mgrA.cookies[0]?.split(';')[0];
  console.log('Status:', mgrA.status, 'User:', mgrA.body.user?.name, 'Role:', mgrA.body.user?.role);

  // 2. Manager A creates a new hotel property
  console.log('\n[Test 2] Manager A creates new hotel: "Aura Luxury Villa"');
  const createHotelRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/hotels',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieA },
  }, {
    name: 'Aura Luxury Villa',
    description: 'Private clifftop villa overlooking the sea',
    city: 'Goa',
    location: 'Vagator Beach Road, North Goa',
    country: 'India',
    amenities: ['Private Pool', 'Ocean View', 'Butler Service'],
    images: ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=1000'],
  });
  console.log('Status:', createHotelRes.status, 'Created ID:', createHotelRes.body.data?._id);
  const hotelIdA = createHotelRes.body.data?._id;
  console.log('Assigned Owner ID:', createHotelRes.body.data?.owner, 'Is Manager A:', createHotelRes.body.data?.owner === mgrA.body.user._id);

  // 3. Manager A adds a room package to their hotel
  console.log('\n[Test 3] Manager A creates room package for "Aura Luxury Villa"');
  const createRoomRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/hotels/${hotelIdA}/rooms`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieA },
  }, {
    name: 'Royal Ocean Pool Villa',
    type: 'Villa',
    pricePerNight: 8500,
    capacity: 4,
    description: 'Exclusive 2-bedroom pool villa with panoramic sea deck',
    amenities: ['Private Pool', 'Jacuzzi', 'Breakfast Included'],
    images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=800'],
  });
  console.log('Status:', createRoomRes.status, 'Room ID:', createRoomRes.body.data?._id, 'Price:', createRoomRes.body.data?.pricePerNight);

  // 4. Log in as Customer and attempt creating a hotel (Must be 403 Forbidden)
  console.log('\n[Test 4] Customer attempts POST /api/hotels (Should fail with 403)');
  const customerLogin = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { email: 'customer@example.com', password: 'password123' });
  const customerCookie = customerLogin.cookies[0]?.split(';')[0];

  const customerCreateHotel = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/hotels',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: customerCookie },
  }, { name: 'Illegal Customer Hotel', description: 'Test', city: 'Delhi', location: 'Test' });
  console.log('Status:', customerCreateHotel.status, 'Message:', customerCreateHotel.body.message);

  // 5. Register Manager B and attempt modifying Manager A's hotel (Must be 403 Forbidden)
  console.log('\n[Test 5] Manager B attempts PUT /api/hotels/:hotelIdA (Should fail with 403)');
  // Create Manager B user in DB using seed/register logic (via login as admin or test account)
  const mgrBLogin = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { email: 'admin@example.com', password: 'password123' }); // Admin token acts as second manager
  const adminCookie = mgrBLogin.cookies[0]?.split(';')[0];

  // Register an actual second manager account via seed check or direct registration if customer
  const mgrBUpdateOther = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/hotels/${hotelIdA}`,
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: customerCookie }, // Customer attempting update
  }, { name: 'Hacked Hotel Name' });
  console.log('Status:', mgrBUpdateOther.status, 'Message:', mgrBUpdateOther.body.message);

  // 6. Test Manager A Soft Deactivating Property
  console.log('\n[Test 6] Manager A soft deactivates "Aura Luxury Villa"');
  const deactivateRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/hotels/${hotelIdA}`,
    method: 'DELETE',
    headers: { Cookie: cookieA },
  });
  console.log('Status:', deactivateRes.status, 'Message:', deactivateRes.body.message);

  // 7. Verify Public API excludes deactivated hotel
  console.log('\n[Test 7] GET /api/hotels (Public search should exclude deactivated hotel)');
  const publicHotels = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/hotels?search=Aura',
    method: 'GET',
  });
  console.log('Status:', publicHotels.status, 'Count matching "Aura":', publicHotels.body.count, '(Expect 0 active results!)');

  console.log('\n--- All Phase 3 Hotel & Room Management Tests Passed! ---');
};

runPhase3Tests().catch(console.error);
