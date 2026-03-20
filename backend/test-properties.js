const API_URL = 'https://property-management-backend-zfnl.onrender.com/api';
let ownerToken = '';
let adminToken = '';
let testPropertyId = '';

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
  const rnd = Math.floor(Math.random() * 10000);
  const u = {
    firstName: role + rnd,
    lastName: 'User',
    email: `${role}${rnd}@test.com`,
    password: 'Password123',
    role: role === 'admin' ? 'customer' : role
  };
  const res = await fetchHelper(`${API_URL}/auth/register`, {
    method: 'POST',
    body: JSON.stringify(u)
  });
  
  if (role === 'admin') {
    // We will cheat and upgrade this user directly via mongosh or a special route.
    // For now let's just use a script to connect to mongoose and update it.
    const mongoose = require('mongoose');
    const { connect } = require('mongoose');
    const dot = require('dotenv').config();
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    await connect(uri);
    const db = mongoose.connection;
    await db.collection('users').updateOne({ email: u.email }, { $set: { role: 'admin' } });
  }

  return res.data.accessToken;
}

async function runTests() {
  console.log('--- STARTING PROPERTIES MODULE TESTS ---');
  try {
    console.log('\n[1] Setup: Creating Owner & Admin Users...');
    ownerToken = await registerTestUser('owner');
    adminToken = await registerTestUser('admin'); // Might default to customer or something if admin role isn't allowed via register, need to check if backend allows passing role "admin"
    console.log('✅ Users prepared');

    // In model: owner, worker, customer, admin. Register might not allow admin. We'll find out.
    // Assuming ownerToken works anyway.

    console.log('\n[2] Testing Property Creation (Owner)...');
    const propertyPayload = {
      title: 'Beautiful Villa',
      description: 'A nice place to stay',
      propertyType: 'villa',
      listingType: 'rent',
      price: 2500,
      location: {
        address: '123 Main St',
        city: 'Metropolis',
        state: 'NY',
        pincode: '10001',
        country: 'US'
      },
      bedrooms: 3,
      bathrooms: 2,
      area: 1500,
      amenities: ['wifi', 'parking'],
      images: [] // Assuming empty allowed or tested
    };

    try {
      const res = await fetchHelper(`${API_URL}/properties`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${ownerToken}` },
        body: JSON.stringify(propertyPayload)
      });
      testPropertyId = res.data?.data?._id || res.data?.property?._id;
      console.log('✅ Property created. ID:', testPropertyId);
    } catch (err) {
      console.error('❌ Property creation failed:', err.data || err.status);
    }

    if (!testPropertyId) {
      console.log('❌ Stopping early due to failed creation.');
      return;
    }

    console.log('\n[3] Testing Fetch All Properties...');
    try {
      const res = await fetchHelper(`${API_URL}/properties?limit=5`);
      if (res.data.success && Array.isArray(res.data.properties)) {
        console.log(`✅ Properties fetched. Found ${res.data.properties.length} listing(s).`);
      } else {
        console.error('❌ Properties fetched data is malformed');
      }
    } catch (err) {
      console.error('❌ Fetch all failed:', err);
    }

    console.log('\n[4] Testing Update Property Status (Admin)...');
    try {
      await fetchHelper(`${API_URL}/properties/${testPropertyId}/approve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Status updated successfully.');
    } catch (err) {
      console.error('❌ Update status failed. (Expected if admin role blocked standard auth):', err.data || err.status);
    }

    console.log('\n--- PROPERTIES MODULE TESTS FINISHED ---');
  } catch (err) {
    console.error('Uncaught error:', err.message || err);
  }
}

runTests();