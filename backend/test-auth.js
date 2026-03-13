const API_URL = 'http://localhost:5000/api/auth';
let authToken = '';

async function fetchHelper(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    }
  });
  
  const data = await res.json().catch(() => null);
  
  if (!res.ok) {
    throw { status: res.status, data, headers: res.headers };
  }
  
  return { status: res.status, data, headers: res.headers };
}

async function runTests() {
  console.log('--- STARTING AUTH MODULE TESTS ---');
  const userPrefix = Math.floor(Math.random() * 10000);
  const testUser = {
    firstName: 'Test',
    lastName: 'User' + userPrefix,
    email: `testuser${userPrefix}@example.com`,
    password: 'Password123',
    phone: '1234567890'
  };

  try {
    // 1. Test Validation (Invalid register)
    console.log('\n[1] Testing Registration Validation...');
    try {
      await fetchHelper(`${API_URL}/register`, {
        method: 'POST',
        body: JSON.stringify({
          firstName: '',
          email: 'invalid-email',
          password: '123'
        })
      });
      console.error('❌ Validation failed to catch bad input');
    } catch (err) {
      if (err.status === 400) {
        console.log('✅ Validation correctly caught bad input');
      } else {
        console.error('❌ Unexpected response on bad input', err.data || err.status);
      }
    }

    // 2. Test Registration
    console.log('\n[2] Testing Valid Registration...');
    try {
      const res = await fetchHelper(`${API_URL}/register`, {
        method: 'POST',
        body: JSON.stringify(testUser)
      });
      console.log('✅ Registration successful');
      
      const cookies = res.headers.get('set-cookie');
      authToken = res.data?.accessToken || (cookies ? cookies.split(';')[0] : null);
    } catch (err) {
      console.error('❌ Registration failed:', err.data || err.status);
    }

    // 3. Test Login
    console.log('\n[3] Testing Login...');
    try {
      const res = await fetchHelper(`${API_URL}/login`, {
        method: 'POST',
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password
        })
      });
      console.log('✅ Login successful');
      
      const cookies = res.headers.get('set-cookie');
      authToken = res.data?.accessToken || (cookies ? cookies.split(';')[0] : null);
    } catch (err) {
      console.error('❌ Login failed:', err.data || err.status);
    }

    if (!authToken) {
      console.log('❌ Token not obtained. Skipping protected route tests.');
      return;
    }

    // Prepare auth headers for protected routes
    const authHeaders = {};
    if (authToken.startsWith('token=')) {
      authHeaders.Cookie = authToken;
    } else {
      authHeaders.Authorization = `Bearer ${authToken}`;
    }

    // 4. Test Fetch Profile (Protected Route)
    console.log('\n[4] Testing Fetch Profile (/me)...');
    try {
      const res = await fetchHelper(`${API_URL}/me`, {
        method: 'GET',
        headers: authHeaders
      });
      if (res.data && res.data.user && res.data.user.email === testUser.email) {
        console.log('✅ Fetch Profile successful');
      } else {
        console.error('❌ Profile matching failed:', res.data);
      }
    } catch (err) {
      console.error('❌ Fetch profile failed:', err.data || err.status);
    }

    // 5. Update Profile
    console.log('\n[5] Testing Profile Update (/update-profile)...');
    try {
      // NOTE: Using multiform data usually needed for avatar, but let's test just body JSON
      // If it forces multipart/form-data because of upload.single('avatar'), it will fail.
      // Need to adjust headers just in case. But let's check basic response.
      const res = await fetchHelper(`${API_URL}/update-profile`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          firstName: 'UpdatedName'
        })
      });
      console.log('✅ Profile Update API called - Response: ', res.data?.success);
    } catch (err) {
      console.error('❌ Profile Update failed:', err.data || err.status);
    }

    console.log('\n--- AUTH MODULE TESTS FINISHED ---');
  } catch (error) {
    console.error('Uncaught error during test execution:', error.message);
  }
}

runTests();
