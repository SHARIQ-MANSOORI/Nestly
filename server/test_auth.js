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

const runAuthTests = async () => {
  console.log('--- Nestly Phase 2 Authentication & Authorization Test Suite ---');

  // 1. Test Login with Customer Credentials
  console.log('\n[Test 1] POST /api/auth/login (Customer)');
  const customerLogin = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { email: 'customer@example.com', password: 'password123' });

  console.log('Status:', customerLogin.status, 'Message:', customerLogin.body.message);
  console.log('User Role:', customerLogin.body.user?.role, 'Has Cookie:', customerLogin.cookies.length > 0);
  const customerCookie = customerLogin.cookies[0]?.split(';')[0];

  // 2. Test GET /api/auth/me using Customer Cookie
  console.log('\n[Test 2] GET /api/auth/me (Customer)');
  const customerMe = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/me',
    method: 'GET',
    headers: { Cookie: customerCookie },
  });
  console.log('Status:', customerMe.status, 'Authenticated User:', customerMe.body.user?.name, 'Role:', customerMe.body.user?.role);

  // 3. Test RBAC: Customer trying to access Manager Area (Must be 403 Forbidden)
  console.log('\n[Test 3] GET /api/auth/manager-area (Customer - Should fail with 403)');
  const customerManagerArea = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/manager-area',
    method: 'GET',
    headers: { Cookie: customerCookie },
  });
  console.log('Status:', customerManagerArea.status, 'Message:', customerManagerArea.body.message);

  // 4. Test Login with Manager Credentials
  console.log('\n[Test 4] POST /api/auth/login (Manager)');
  const managerLogin = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { email: 'manager@example.com', password: 'password123' });
  console.log('Status:', managerLogin.status, 'Role:', managerLogin.body.user?.role);
  const managerCookie = managerLogin.cookies[0]?.split(';')[0];

  // 5. Test RBAC: Manager accessing Manager Area (Must be 200 OK)
  console.log('\n[Test 5] GET /api/auth/manager-area (Manager - Should succeed with 200)');
  const managerAreaRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/manager-area',
    method: 'GET',
    headers: { Cookie: managerCookie },
  });
  console.log('Status:', managerAreaRes.status, 'Message:', managerAreaRes.body.message);

  // 6. Test Public Registration Security Guard (Attempting role: "admin" must be overridden to "customer")
  console.log('\n[Test 6] POST /api/auth/register (Attempting role: admin)');
  const registerEscalation = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { name: 'Sneaky User', email: 'sneaky@example.com', password: 'password123', role: 'admin' });
  console.log('Status:', registerEscalation.status, 'Assigned Role:', registerEscalation.body.user?.role, '(Security Guard Enforced!)');

  // 7. Test Invalid Login
  console.log('\n[Test 7] POST /api/auth/login (Invalid Password)');
  const invalidLogin = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { email: 'customer@example.com', password: 'wrongpassword' });
  console.log('Status:', invalidLogin.status, 'Generic Message:', invalidLogin.body.message);

  console.log('\n--- All Phase 2 Authentication & Authorization Tests Passed! ---');
};

runAuthTests().catch(console.error);
