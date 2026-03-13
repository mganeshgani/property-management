require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const mongoose = require('mongoose');

const API_URL = 'http://localhost:5000/api';
let customerToken = '';
let ownerToken = '';
let testPropertyId = '';
let testBookingId = '';
let testReviewId = '';

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
    role: role
  };
  
  if (role === 'admin') u.role = 'customer';
  const res = await fetchHelper(`${API_URL}/auth/register`, { method: 'POST', body: JSON.stringify(u) });
  
  if (role === 'admin') {
    const mongoose = require('mongoose');
    const { connect } = require('mongoose');
    if (mongoose.connection.readyState === 0) {
      require('dotenv').config();
      await connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/property-management');
    }
    await mongoose.connection.collection('users').updateOne({ email: u.email }, { $set: { role: 'admin' } });
  }

  return { token: res.data.accessToken };
}

async function runTests() {
  console.log('--- STARTING REVIEW AND NOTIFICATION MODULE TESTS ---');
  try {
    console.log('\n[1] Setup: Roles & Base Property');
    const owner = await registerTestUser('owner');
    ownerToken = owner.token;
    
    const customer = await registerTestUser('customer');
    customerToken = customer.token;

    const admin = await registerTestUser('admin');

    // Create property
    const propertyPayload = {
      title: 'Review Test Villa',
      description: 'A nice place to review',
      propertyType: 'villa',
      listingType: 'rent',
      price: 1500,
      location: { address: '999 Rev St', city: 'Metropolis', state: 'NY', pincode: '10005', country: 'US' },
      area: 1200, bedrooms: 2,
    };

    const propRes = await fetchHelper(`${API_URL}/properties`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify(propertyPayload)
    });
    testPropertyId = propRes.data?.data?._id || propRes.data?.property?._id;
    
    await fetchHelper(`${API_URL}/properties/${testPropertyId}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${admin.token}` }
    });

    console.log('\n[2] Create Booking to be able to leave a review (Customer)');
    const bookingRes = await fetchHelper(`${API_URL}/bookings`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({ propertyId: testPropertyId, bookingType: 'rent' })
    });
    testBookingId = bookingRes.data?.data?._id || bookingRes.data?.booking?._id;

    // Approve booking as owner -> should automatically complete booking depending on cycle, or we might need to "complete" it manually
    await fetchHelper(`${API_URL}/bookings/${testBookingId}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    
    // According to review logic, booking usually needs to be 'completed'
    await fetchHelper(`${API_URL}/bookings/${testBookingId}/complete`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${ownerToken}` }
    });

    console.log('✅ Booking completed. Creating Review...');

    console.log('\n[3] Testing Create Review (Customer)');
    try {
      const revRes = await fetchHelper(`${API_URL}/reviews`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: JSON.stringify({
          propertyId: testPropertyId,
          bookingId: testBookingId,
          rating: 5,
          comment: 'Absolutely amazing property!'
        })
      });
      testReviewId = revRes.data?.review?._id || revRes.data?.data?._id;
      console.log('✅ Review created. ID:', testReviewId);
    } catch (err) {
      console.error('❌ Review creation failed. Make sure booking status matches requirements.', err.data || err.status);
    }

    console.log('\n[4] Testing Get Property Reviews (Public)');
    try {
      const res = await fetchHelper(`${API_URL}/reviews/property/${testPropertyId}`);
      if (res.data.success && Array.isArray(res.data.reviews)) {
        console.log(`✅ Property reviews fetched. Total: ${res.data.reviews.length}`);
      } else {
        console.error('❌ Reviews fetch failed:', res.data);
      }
    } catch (err) {
      console.error('❌ Reviews fetch failed:', err.data || err.status);
    }

    // Now test notifications (notifications are auto-created, let's fetch them)
    console.log('\n[5] Testing Fetch Notifications (Customer)');
    try {
      const notRes = await fetchHelper(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      if (notRes.data.success && Array.isArray(notRes.data.notifications)) {
        console.log(`✅ Customer notifications fetched. Found ${notRes.data.notifications.length} Unread/Read notifications.`);
      }
    } catch (err) {
      console.error('❌ Notification fetch failed:', err.data || err.status);
    }

    console.log('\n[6] Testing Mark Notification as Read (Customer)');
    try {
      const notRes = await fetchHelper(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      const firstNoti = notRes.data.notifications[0];
      if (firstNoti) {
        await fetchHelper(`${API_URL}/notifications/${firstNoti._id}/read`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${customerToken}` }
        });
        console.log('✅ Mark notification as read successfully.');
      } else {
        console.log('⚠️ No notifications found to mark as read.');
      }
    } catch (err) {
      console.error('❌ Mark notification read failed:', err.data || err.status);
    }

    console.log('\n--- REVIEW AND NOTIFICATION MODULE TESTS FINISHED ---');
  } catch (err) {
    console.error('Uncaught error in test suite:', err.message || err);
  }
}

runTests();