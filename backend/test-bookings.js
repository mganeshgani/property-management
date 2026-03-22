const API_URL = 'https://property-management-backend-zfnl.onrender.com/api';
const mongoose = require('mongoose');
let customerToken = '';
let ownerToken = '';
let testPropertyId = '';
let testBookingId = '';

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
    const { connect } = require('mongoose');
    if (mongoose.connection.readyState === 0) {
      require('dotenv').config();
      const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/property-management';
      await connect(uri);
    }
    await mongoose.connection.collection('users').updateOne({ email: u.email }, { $set: { role: 'admin' } });
  }
  return res.data.accessToken;
}

async function runTests() {
  console.log('--- STARTING BOOKINGS MODULE TESTS ---');
  try {
    console.log('\n[1] Setup: Creating Roles & Property...');
    ownerToken = await registerTestUser('owner');
    customerToken = await registerTestUser('customer');
    let adminToken = await registerTestUser('admin');
    console.log('✅ Users prepared');

    // Create a property by the owner to be booked
    const propertyPayload = {
      title: 'Booking Test Villa',
      description: 'A nice place to stay',
      propertyType: 'villa',
      listingType: 'rent',
      price: 2500,
      location: {
        address: '456 Booking St',
        city: 'Metropolis',
        state: 'NY',
        pincode: '10002',
        country: 'US'
      },
      bedrooms: 2,
      area: 1200,
    };

    const propRes = await fetchHelper(`${API_URL}/properties`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify(propertyPayload)
    });
    testPropertyId = propRes.data?.data?._id || propRes.data?.property?._id;
    console.log('✅ Property created. ID:', testPropertyId);

    // APPROVE THE PROPERTY
    await fetchHelper(`${API_URL}/properties/${testPropertyId}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Property approved by admin.');

    console.log('\n[2] Testing Booking Creation (Customer)...');
    try {
      const res = await fetchHelper(`${API_URL}/bookings`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: JSON.stringify({
          propertyId: testPropertyId,
          bookingType: 'visit'
        })
      });
      testBookingId = res.data?.data?._id || res.data?.booking?._id;
      console.log('✅ Booking created. ID:', testBookingId);
    } catch (err) {
      console.error('❌ Booking creation failed:', err.data || err.status);
    }

    if (!testBookingId) {
      console.log('❌ Stopping early due to failed booking.');
      return;
    }

    console.log('\n[3] Testing Get My Bookings (Customer)...');
    try {
      const res = await fetchHelper(`${API_URL}/bookings/my-bookings`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      if (res.data.success && Array.isArray(res.data.bookings)) {
        console.log(`✅ Fetched customer bookings (${res.data.bookings.length})`);
      } else {
        console.error('❌ Data malformed:', res.data);
      }
    } catch (err) {
      console.error('❌ Fetch failed:', err.data || err.status);
    }

    console.log('\n[4] Testing Approve Booking (Owner)...');
    try {
      await fetchHelper(`${API_URL}/bookings/${testBookingId}/approve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${ownerToken}` }
      });
      console.log('✅ Booking approved successfully.');
    } catch (err) {
      console.error('❌ Approve booking failed:', err.data || err.status);
    }

    console.log('\n[5] Testing Cancel Booking (Customer)...');
    try {
      await fetchHelper(`${API_URL}/bookings/${testBookingId}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      console.log('✅ Booking cancelled successfully.');
    } catch (err) {
      console.error('❌ Cancel booking failed:', err.data || err.status);
    }

    console.log('\n--- BOOKINGS MODULE TESTS FINISHED ---');
  } catch (err) {
    console.error('Uncaught error:', err.message || err);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

runTests();