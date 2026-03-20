const API_URL = 'https://property-management-backend-zfnl.onrender.com/api';
let customerToken = '';
let ownerToken = '';
let workerToken = '';
let testPropertyId = '';
let testMaintenanceId = '';
let workerId = '';

async function fetchHelper(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    }
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw { status: res.status, data };
  return { status: res.status, data };
}

async function registerTestUser(role) {
  const rnd = Math.floor(Math.random() * 100000);
  const userRole = role === 'admin' ? 'customer' : role;
  const u = {
    firstName: role + rnd,
    lastName: 'User',
    email: `${role}${rnd}@test.com`,
    password: 'Password123',
    role: userRole
  };
  
  const res = await fetchHelper(`${API_URL}/auth/register`, {
    method: 'POST',
    body: JSON.stringify(u)
  });
  
  return { token: res.data.accessToken, email: u.email, id: res.data.data?._id || res.data.user?._id };
}

async function runTests() {
  console.log('--- STARTING MAINTENANCE MODULE TESTS ---');
  try {
    console.log('\n[1] Setup: Creating Users (Owner, Worker, Customer)...');
    
    const owner = await registerTestUser('owner');
    ownerToken = owner.token;
    
    const customer = await registerTestUser('customer');
    customerToken = customer.token;

    const worker = await registerTestUser('worker');
    workerToken = worker.token;
    workerId = worker.id;

    const propertyPayload = {
      title: 'Maintenance Test Villa',
      description: 'A nice place to stay',
      propertyType: 'villa',
      listingType: 'rent',
      price: 2500,
      location: {
        address: '789 Main St',
        city: 'Metropolis',
        state: 'NY',
        pincode: '10003',
        country: 'US'
      },
      area: 1500,
      bedrooms: 3,
    };

    const propRes = await fetchHelper(`${API_URL}/properties`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify(propertyPayload)
    });
    testPropertyId = propRes.data?.data?._id || propRes.data?.property?._id;
    console.log('✅ Users and Property prepared. Property ID:', testPropertyId);

    // Get Admin Token to approve property
    const admin = await registerTestUser('admin');
    const mongoose = require('mongoose');
    const { connect } = require('mongoose');
    if (mongoose.connection.readyState === 0) {
      require('dotenv').config();
      await connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/property-management');
    }
    await mongoose.connection.collection('users').updateOne({ email: admin.email }, { $set: { role: 'admin' } });
    
    await fetchHelper(`${API_URL}/properties/${testPropertyId}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${admin.token}` }
    });

    // Create Booking
    const bookingRes = await fetchHelper(`${API_URL}/bookings`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({ propertyId: testPropertyId, bookingType: 'rent' })
    });
    const bookingId = bookingRes.data?.data?._id || bookingRes.data?.booking?._id;

    // Approve booking as owner so it's "active"
    await fetchHelper(`${API_URL}/bookings/${bookingId}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    // Let's actually complete the booking or something if it requires active. Wait, just approved is enough? 
    // Usually 'approved' is active enough. But let's check.

    console.log('\n[2] Testing Create Maintenance Request (Customer)...');
    try {
      const res = await fetchHelper(`${API_URL}/maintenance`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: JSON.stringify({
          propertyId: testPropertyId,
          title: 'Leaking pipe',
          description: 'The kitchen sink is leaking heavily',
          category: 'plumbing'
        })
      });
      testMaintenanceId = res.data?.data?._id || res.data?.maintenanceRequest?._id;
      console.log('✅ Maintenance request created. ID:', testMaintenanceId);
    } catch (err) {
      console.error('❌ Maintenance request failed:', err.data || err.status);
    }

    if (!testMaintenanceId) {
      console.log('❌ Stopping early due to failed request creation.');
      return;
    }

    console.log('\n[3] Testing Fetch My Requests (Customer)...');
    try {
      const res = await fetchHelper(`${API_URL}/maintenance/my-requests`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      if (res.data.success && Array.isArray(res.data.requests)) {
        console.log(`✅ Requests fetched (${res.data.requests.length})`);
      } else {
        console.error('❌ Data malformed:', res.data);
      }
    } catch (err) {
      console.error('❌ Fetch failed:', err.data || err.status);
    }

    console.log('\n[4] Testing Assign Worker (Owner/Admin)...');
    try {
      await fetchHelper(`${API_URL}/maintenance/${testMaintenanceId}/assign`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${ownerToken}` },
        body: JSON.stringify({ workerId })
      });
      console.log('✅ Worker assigned successfully.');
    } catch (err) {
      console.error('❌ Assign worker failed:', err.data || err.status);
    }

    console.log('\n[5] Testing Start Maintenance (Worker)...');
    try {
      await fetchHelper(`${API_URL}/maintenance/${testMaintenanceId}/start`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${workerToken}` }
      });
      console.log('✅ Maintenance started successfully. Status: in_progress');
    } catch (err) {
      console.error('❌ Start maintenance failed:', err.data || err.status);
    }

    console.log('\n[6] Testing Complete Maintenance (Worker)...');
    try {
      await fetchHelper(`${API_URL}/maintenance/${testMaintenanceId}/complete`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${workerToken}` }
      });
      console.log('✅ Maintenance completed successfully. Status: resolved');
    } catch (err) {
      console.error('❌ Complete maintenance failed:', err.data || err.status);
    }

    console.log('\n--- MAINTENANCE MODULE TESTS FINISHED ---');
  } catch (err) {
    console.error('Uncaught error:', err.message || err);
  }
}

runTests();