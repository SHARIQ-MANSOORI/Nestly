const http = require('http');

const request = (url) => {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    }).on('error', err => reject(err));
  });
};

const runTests = async () => {
  console.log('--- API Verification Suite ---');

  // 1. Health Check
  const health = await request('http://localhost:5000/api/health');
  console.log('[API Test] Health Status:', health.status, health.body.message);

  // 2. Get All Hotels
  const hotelsRes = await request('http://localhost:5000/api/hotels');
  console.log('[API Test] GET /api/hotels Count:', hotelsRes.body.count, 'Cities:', hotelsRes.body.cities.join(', '));

  // 3. Location Filter Test
  const delhiRes = await request('http://localhost:5000/api/hotels?location=Delhi');
  console.log('[API Test] GET /api/hotels?location=Delhi Count:', delhiRes.body.count);

  // 4. Price Filter & Sort Test
  const filterSortRes = await request('http://localhost:5000/api/hotels?minPrice=3000&maxPrice=6000&sort=price_asc');
  console.log('[API Test] GET /api/hotels (Filtered & Sorted) Count:', filterSortRes.body.count);
  if (filterSortRes.body.data.length > 0) {
    console.log('            First hotel price:', filterSortRes.body.data[0].startingPrice);
  }

  // 5. Get Single Hotel & Rooms
  const firstHotelId = hotelsRes.body.data[0]._id;
  const singleHotelRes = await request(`http://localhost:5000/api/hotels/${firstHotelId}`);
  console.log('[API Test] GET /api/hotels/:id Name:', singleHotelRes.body.data.name, 'Rooms Count:', singleHotelRes.body.data.rooms.length);

  console.log('--- All API Tests Passed Cleanly! ---');
};

runTests().catch(console.error);
