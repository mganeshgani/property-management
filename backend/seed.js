/**
 * Seed script — creates dummy users for all roles, properties, bookings,
 * maintenance requests, reviews, notifications, and payments.
 *
 * Usage:  cd backend && node seed.js
 *
 * All passwords: Password1
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Property = require('./models/Property');
const Booking = require('./models/Booking');
const MaintenanceRequest = require('./models/MaintenanceRequest');
const Review = require('./models/Review');
const Notification = require('./models/Notification');
const Payment = require('./models/Payment');

const MONGO_URI = process.env.MONGODB_URI;

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // ── Clean existing data ──
    await Promise.all([
      User.deleteMany({}),
      Property.deleteMany({}),
      Booking.deleteMany({}),
      MaintenanceRequest.deleteMany({}),
      Review.deleteMany({}),
      Notification.deleteMany({}),
      Payment.deleteMany({}),
    ]);
    console.log('Cleared all collections');

    // ── Hash password once ──
    const hashedPassword = await bcrypt.hash('Password1', 12);

    // ── Create Users ──
    const users = await User.insertMany([
      {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@test.com',
        password: hashedPassword,
        phone: '9000000001',
        role: 'admin',
        isEmailVerified: true,
        isActive: true,
        address: { street: '1 Admin Lane', city: 'Bangalore', state: 'Karnataka', pincode: '560001', country: 'India' },
      },
      {
        firstName: 'Rahul',
        lastName: 'Sharma',
        email: 'owner@test.com',
        password: hashedPassword,
        phone: '9000000002',
        role: 'owner',
        isEmailVerified: true,
        isActive: true,
        address: { street: '42 MG Road', city: 'Bangalore', state: 'Karnataka', pincode: '560001', country: 'India' },
      },
      {
        firstName: 'Priya',
        lastName: 'Patel',
        email: 'owner2@test.com',
        password: hashedPassword,
        phone: '9000000006',
        role: 'owner',
        isEmailVerified: true,
        isActive: true,
        address: { street: '88 Church Street', city: 'Bangalore', state: 'Karnataka', pincode: '560001', country: 'India' },
      },
      {
        firstName: 'Anita',
        lastName: 'Kumar',
        email: 'customer@test.com',
        password: hashedPassword,
        phone: '9000000003',
        role: 'customer',
        isEmailVerified: true,
        isActive: true,
        address: { street: '7 Park Avenue', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', country: 'India' },
      },
      {
        firstName: 'Suresh',
        lastName: 'Reddy',
        email: 'customer2@test.com',
        password: hashedPassword,
        phone: '9000000007',
        role: 'customer',
        isEmailVerified: true,
        isActive: true,
        address: { street: '55 Lake Road', city: 'Hyderabad', state: 'Telangana', pincode: '500001', country: 'India' },
      },
      {
        firstName: 'Vikram',
        lastName: 'Singh',
        email: 'worker@test.com',
        password: hashedPassword,
        phone: '9000000004',
        role: 'worker',
        isEmailVerified: true,
        isActive: true,
        address: { street: '15 Nehru Nagar', city: 'Delhi', state: 'Delhi', pincode: '110001', country: 'India' },
      },
      {
        firstName: 'Ravi',
        lastName: 'Verma',
        email: 'worker2@test.com',
        password: hashedPassword,
        phone: '9000000008',
        role: 'worker',
        isEmailVerified: true,
        isActive: true,
        address: { street: '22 Industrial Area', city: 'Pune', state: 'Maharashtra', pincode: '411001', country: 'India' },
      },
    ]);

    const admin = users[0];
    const owner1 = users[1];
    const owner2 = users[2];
    const customer1 = users[3];
    const customer2 = users[4];
    const worker1 = users[5];
    const worker2 = users[6];

    console.log('Created 7 users');

    // ── Create Properties ──
    const propertiesData = [
      {
        title: 'Luxurious 3BHK Apartment in Koramangala',
        slug: 'luxurious-3bhk-apartment-in-koramangala',
        description: 'A beautifully designed 3BHK apartment with modern amenities, located in the heart of Koramangala. Close to IT parks, restaurants, and shopping malls. The apartment features spacious rooms, a modular kitchen, and a balcony with a city view.',
        propertyType: 'flat',
        listingType: 'rent',
        price: 35000,
        priceUnit: 'per_month',
        area: 1450,
        bedrooms: 3,
        bathrooms: 2,
        floors: 1,
        furnishing: 'furnished',
        amenities: ['WiFi', 'Parking', 'Gym', 'Security', 'Power Backup', 'Lift', 'CCTV'],
        location: { address: '42 Koramangala 4th Block', city: 'Bangalore', state: 'Karnataka', pincode: '560034', country: 'India' },
        images: [{ url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', publicId: 'seed_prop_1' }],
        owner: owner1._id,
        status: 'available',
        isActive: true,
        isFeatured: true,
        views: 245,
      },
      {
        title: 'Spacious Villa with Garden in Whitefield',
        slug: 'spacious-villa-with-garden-in-whitefield',
        description: 'Stunning 4BHK villa with a private garden, swimming pool, and modern interiors. Located in a gated community with 24/7 security. Perfect for families looking for a premium living experience.',
        propertyType: 'villa',
        listingType: 'sale',
        price: 15000000,
        priceUnit: 'total',
        area: 3200,
        bedrooms: 4,
        bathrooms: 4,
        floors: 2,
        furnishing: 'furnished',
        amenities: ['Swimming Pool', 'Garden', 'Parking', 'Security', 'Power Backup', 'Clubhouse', 'CCTV', 'Gas Pipeline'],
        location: { address: '128 Palm Meadows', city: 'Bangalore', state: 'Karnataka', pincode: '560066', country: 'India' },
        images: [{ url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800', publicId: 'seed_prop_2' }],
        owner: owner1._id,
        status: 'available',
        isActive: true,
        isFeatured: true,
        views: 412,
      },
      {
        title: 'Cozy 2BHK Flat Near Indiranagar Metro',
        slug: 'cozy-2bhk-flat-near-indiranagar-metro',
        description: 'Well-maintained 2BHK flat just 5 minutes walk from Indiranagar Metro station. Ideal for working professionals. Features semi-furnished interiors with good ventilation and natural light.',
        propertyType: 'flat',
        listingType: 'rent',
        price: 22000,
        priceUnit: 'per_month',
        area: 1100,
        bedrooms: 2,
        bathrooms: 2,
        floors: 1,
        furnishing: 'semi',
        amenities: ['Parking', 'Security', 'Lift', 'Water Supply', 'Power Backup'],
        location: { address: '15 Indiranagar 2nd Stage', city: 'Bangalore', state: 'Karnataka', pincode: '560038', country: 'India' },
        images: [{ url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800', publicId: 'seed_prop_3' }],
        owner: owner2._id,
        status: 'available',
        isActive: true,
        isFeatured: false,
        views: 187,
      },
      {
        title: 'Commercial Office Space in Electronic City',
        slug: 'commercial-office-space-in-electronic-city',
        description: 'Modern commercial office space of 2000 sqft with all amenities. Suitable for IT companies and startups. Located on the main road with excellent connectivity.',
        propertyType: 'commercial',
        listingType: 'lease',
        price: 120000,
        priceUnit: 'per_month',
        area: 2000,
        bedrooms: 0,
        bathrooms: 2,
        floors: 1,
        furnishing: 'unfurnished',
        amenities: ['Parking', 'Lift', 'CCTV', 'Fire Safety', 'Power Backup', 'AC', 'Intercom'],
        location: { address: 'Tower A, Tech Park', city: 'Bangalore', state: 'Karnataka', pincode: '560100', country: 'India' },
        images: [{ url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800', publicId: 'seed_prop_4' }],
        owner: owner1._id,
        status: 'available',
        isActive: true,
        isFeatured: false,
        views: 95,
      },
      {
        title: 'Independent House in JP Nagar',
        slug: 'independent-house-in-jp-nagar',
        description: 'A charming independent house with 3 bedrooms, a spacious living room, and a beautiful terrace garden. Quiet residential area with all amenities nearby.',
        propertyType: 'house',
        listingType: 'sale',
        price: 8500000,
        priceUnit: 'total',
        area: 1800,
        bedrooms: 3,
        bathrooms: 2,
        floors: 2,
        furnishing: 'semi',
        amenities: ['Parking', 'Garden', 'Water Supply', 'Power Backup'],
        location: { address: '90 JP Nagar 6th Phase', city: 'Bangalore', state: 'Karnataka', pincode: '560078', country: 'India' },
        images: [{ url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800', publicId: 'seed_prop_5' }],
        owner: owner2._id,
        status: 'available',
        isActive: true,
        isFeatured: true,
        views: 310,
      },
      {
        title: 'Budget Studio Apartment in BTM Layout',
        slug: 'budget-studio-apartment-in-btm-layout',
        description: 'Affordable studio apartment perfect for students and bachelors. Fully furnished with a kitchenette, bathroom, and balcony. Walking distance to BTM Lake.',
        propertyType: 'flat',
        listingType: 'rent',
        price: 12000,
        priceUnit: 'per_month',
        area: 450,
        bedrooms: 1,
        bathrooms: 1,
        floors: 1,
        furnishing: 'furnished',
        amenities: ['WiFi', 'Security', 'Water Supply'],
        location: { address: '14 BTM 2nd Stage', city: 'Bangalore', state: 'Karnataka', pincode: '560076', country: 'India' },
        images: [{ url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', publicId: 'seed_prop_6' }],
        owner: owner1._id,
        status: 'available',
        isActive: true,
        isFeatured: false,
        views: 156,
      },
      {
        title: 'Residential Plot in Sarjapur Road',
        slug: 'residential-plot-in-sarjapur-road',
        description: 'BBMP-approved residential plot of 2400 sqft in a well-developed layout near Sarjapur Road. Nice investment opportunity with expected appreciation.',
        propertyType: 'plot',
        listingType: 'sale',
        price: 6000000,
        priceUnit: 'total',
        area: 2400,
        bedrooms: 0,
        bathrooms: 0,
        floors: 1,
        furnishing: 'unfurnished',
        amenities: [],
        location: { address: 'Green Valley Layout', city: 'Bangalore', state: 'Karnataka', pincode: '562125', country: 'India' },
        images: [{ url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800', publicId: 'seed_prop_7' }],
        owner: owner2._id,
        status: 'available',
        isActive: true,
        isFeatured: false,
        views: 88,
      },
      {
        title: 'Pending Approval - New Flat in HSR Layout',
        slug: 'pending-approval-new-flat-in-hsr-layout',
        description: 'Brand new 2BHK flat with top-notch finishes in HSR Layout. This property is awaiting admin approval.',
        propertyType: 'flat',
        listingType: 'rent',
        price: 28000,
        priceUnit: 'per_month',
        area: 1200,
        bedrooms: 2,
        bathrooms: 2,
        floors: 1,
        furnishing: 'semi',
        amenities: ['Parking', 'Lift', 'CCTV', 'Power Backup'],
        location: { address: '5 HSR Sector 2', city: 'Bangalore', state: 'Karnataka', pincode: '560102', country: 'India' },
        images: [{ url: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800', publicId: 'seed_prop_8' }],
        owner: owner1._id,
        status: 'pending',
        isActive: true,
        isFeatured: false,
        views: 0,
      },
    ];

    const properties = await Property.insertMany(propertiesData);
    console.log(`Created ${properties.length} properties`);

    const prop1 = properties[0]; // 3BHK Koramangala (rent, owner1)
    const prop2 = properties[1]; // Villa Whitefield (sale, owner1)
    const prop3 = properties[2]; // 2BHK Indiranagar (rent, owner2)
    const prop4 = properties[3]; // Commercial (lease, owner1)
    const prop5 = properties[4]; // House JP Nagar (sale, owner2)
    const prop6 = properties[5]; // Studio BTM (rent, owner1)

    // ── Create Bookings ──
    const bookings = await Booking.insertMany([
      {
        property: prop1._id,
        tenant: customer1._id,
        owner: owner1._id,
        bookingType: 'rent',
        moveInDate: new Date('2026-03-01'),
        moveOutDate: new Date('2027-03-01'),
        duration: 12,
        totalAmount: 420000,
        depositAmount: 70000,
        status: 'approved',
        paymentStatus: 'paid',
        notes: 'Looking forward to moving in!',
      },
      {
        property: prop3._id,
        tenant: customer2._id,
        owner: owner2._id,
        bookingType: 'rent',
        moveInDate: new Date('2026-04-01'),
        moveOutDate: new Date('2026-10-01'),
        duration: 6,
        totalAmount: 132000,
        depositAmount: 44000,
        status: 'approved',
        paymentStatus: 'partial',
        notes: 'Will be shifting from Hyderabad',
      },
      {
        property: prop2._id,
        tenant: customer1._id,
        owner: owner1._id,
        bookingType: 'visit',
        visitDate: new Date('2026-03-15'),
        totalAmount: 0,
        depositAmount: 0,
        status: 'pending',
        paymentStatus: 'unpaid',
        notes: 'Want to visit the villa this weekend',
      },
      {
        property: prop5._id,
        tenant: customer2._id,
        owner: owner2._id,
        bookingType: 'buy',
        totalAmount: 8500000,
        depositAmount: 850000,
        status: 'pending',
        paymentStatus: 'unpaid',
        notes: 'Interested in buying, need a home loan',
      },
      {
        property: prop6._id,
        tenant: customer1._id,
        owner: owner1._id,
        bookingType: 'rent',
        moveInDate: new Date('2026-02-01'),
        moveOutDate: new Date('2026-08-01'),
        duration: 6,
        totalAmount: 72000,
        depositAmount: 24000,
        status: 'completed',
        paymentStatus: 'paid',
        notes: 'Great stay, leaving for a bigger flat',
      },
      {
        property: prop4._id,
        tenant: customer2._id,
        owner: owner1._id,
        bookingType: 'rent',
        moveInDate: new Date('2026-05-01'),
        totalAmount: 120000,
        depositAmount: 240000,
        status: 'rejected',
        paymentStatus: 'unpaid',
        rejectionReason: 'Office space reserved for another tenant',
        notes: 'Wanted for startup office',
      },
    ]);
    console.log(`Created ${bookings.length} bookings`);

    // ── Create Maintenance Requests ──
    const maintenanceRequests = await MaintenanceRequest.insertMany([
      {
        property: prop1._id,
        raisedBy: customer1._id,
        owner: owner1._id,
        assignedTo: worker1._id,
        title: 'Kitchen sink leaking',
        description: 'The kitchen sink has been leaking for 2 days. Water drips constantly from the faucet connection.',
        category: 'plumbing',
        priority: 'high',
        status: 'assigned',
        images: [],
      },
      {
        property: prop1._id,
        raisedBy: customer1._id,
        owner: owner1._id,
        assignedTo: worker2._id,
        title: 'Bedroom light not working',
        description: 'The ceiling light in the master bedroom stopped working. Already tried changing the bulb.',
        category: 'electrical',
        priority: 'medium',
        status: 'in_progress',
        workerNotes: 'Checked wiring, need to replace the switch board. Parts ordered.',
        images: [],
      },
      {
        property: prop3._id,
        raisedBy: customer2._id,
        owner: owner2._id,
        title: 'Bathroom door handle broken',
        description: 'The bathroom door handle came off. Need replacement.',
        category: 'carpentry',
        priority: 'low',
        status: 'open',
        images: [],
      },
      {
        property: prop1._id,
        raisedBy: customer1._id,
        owner: owner1._id,
        assignedTo: worker1._id,
        title: 'AC not cooling properly',
        description: 'The living room AC is running but not cooling effectively. Maybe needs gas refill.',
        category: 'electrical',
        priority: 'medium',
        status: 'completed',
        workerNotes: 'AC gas refilled and filters cleaned. Working fine now.',
        completedAt: new Date('2026-02-20'),
        images: [],
      },
      {
        property: prop6._id,
        raisedBy: customer1._id,
        owner: owner1._id,
        title: 'Wall needs repainting',
        description: 'Dampness has caused paint peeling on the bedroom wall.',
        category: 'painting',
        priority: 'low',
        status: 'open',
        images: [],
      },
    ]);
    console.log(`Created ${maintenanceRequests.length} maintenance requests`);

    // ── Create Reviews (only for completed bookings) ──
    const reviews = await Review.insertMany([
      {
        property: prop6._id,
        reviewer: customer1._id,
        booking: bookings[4]._id, // completed booking
        rating: 4,
        comment: 'Nice cozy studio apartment. Clean and well-maintained. Only downside is limited parking.',
        isVisible: true,
      },
    ]);
    console.log(`Created ${reviews.length} reviews`);

    // ── Create Notifications ──
    const notifications = await Notification.insertMany([
      {
        user: customer1._id,
        type: 'booking',
        title: 'Booking Approved',
        message: 'Your booking for "Luxurious 3BHK Apartment in Koramangala" has been approved!',
        isRead: false,
        link: '/dashboard/bookings',
      },
      {
        user: customer1._id,
        type: 'maintenance',
        title: 'Maintenance Assigned',
        message: 'A worker has been assigned to fix your kitchen sink leak.',
        isRead: true,
        link: '/dashboard/maintenance',
      },
      {
        user: owner1._id,
        type: 'booking',
        title: 'New Booking Request',
        message: 'Anita Kumar has requested to visit "Spacious Villa with Garden in Whitefield".',
        isRead: false,
        link: '/dashboard/bookings',
      },
      {
        user: owner1._id,
        type: 'property',
        title: 'Property Approved',
        message: 'Your property "Luxurious 3BHK Apartment in Koramangala" has been approved and is now live.',
        isRead: true,
        link: '/properties',
      },
      {
        user: worker1._id,
        type: 'maintenance',
        title: 'New Task Assigned',
        message: 'You have been assigned to fix a kitchen sink leak at Koramangala.',
        isRead: false,
        link: '/dashboard/maintenance',
      },
      {
        user: admin._id,
        type: 'property',
        title: 'New Property Listing',
        message: 'Rahul Sharma submitted "Pending Approval - New Flat in HSR Layout" for approval.',
        isRead: false,
        link: '/dashboard/admin/properties',
      },
      {
        user: customer2._id,
        type: 'booking',
        title: 'Booking Rejected',
        message: 'Your booking for "Commercial Office Space in Electronic City" was rejected. Reason: Office space reserved for another tenant.',
        isRead: false,
        link: '/dashboard/bookings',
      },
      {
        user: owner2._id,
        type: 'maintenance',
        title: 'New Maintenance Request',
        message: 'Suresh Reddy raised a maintenance request for bathroom door handle.',
        isRead: false,
        link: '/dashboard/maintenance',
      },
    ]);
    console.log(`Created ${notifications.length} notifications`);

    // ── Create Payments ──
    const payments = await Payment.insertMany([
      {
        booking: bookings[0]._id,
        payer: customer1._id,
        amount: 70000,
        currency: 'INR',
        paymentMethod: 'upi',
        transactionId: 'TXN_SEED_001',
        status: 'success',
        paidAt: new Date('2026-02-15'),
      },
      {
        booking: bookings[0]._id,
        payer: customer1._id,
        amount: 35000,
        currency: 'INR',
        paymentMethod: 'bank',
        transactionId: 'TXN_SEED_002',
        status: 'success',
        paidAt: new Date('2026-03-01'),
      },
      {
        booking: bookings[1]._id,
        payer: customer2._id,
        amount: 44000,
        currency: 'INR',
        paymentMethod: 'online',
        transactionId: 'TXN_SEED_003',
        status: 'success',
        paidAt: new Date('2026-03-20'),
      },
      {
        booking: bookings[4]._id,
        payer: customer1._id,
        amount: 96000,
        currency: 'INR',
        paymentMethod: 'bank',
        transactionId: 'TXN_SEED_004',
        status: 'success',
        paidAt: new Date('2026-02-01'),
      },
    ]);
    console.log(`Created ${payments.length} payments`);

    // ── Summary ──
    console.log('\n══════════════════════════════════════════');
    console.log('  SEED COMPLETE — All passwords: Password1');
    console.log('══════════════════════════════════════════');
    console.log('  Admin:     admin@test.com');
    console.log('  Owner 1:   owner@test.com');
    console.log('  Owner 2:   owner2@test.com');
    console.log('  Customer:  customer@test.com');
    console.log('  Customer2: customer2@test.com');
    console.log('  Worker:    worker@test.com');
    console.log('  Worker2:   worker2@test.com');
    console.log('══════════════════════════════════════════');
    console.log(`  ${properties.length} properties`);
    console.log(`  ${bookings.length} bookings`);
    console.log(`  ${maintenanceRequests.length} maintenance requests`);
    console.log(`  ${reviews.length} reviews`);
    console.log(`  ${notifications.length} notifications`);
    console.log(`  ${payments.length} payments`);
    console.log('══════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
