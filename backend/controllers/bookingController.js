const Booking = require('../models/Booking');
const Property = require('../models/Property');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const sendEmail = require('../utils/sendEmail');
const createNotification = require('../utils/createNotification');

// @desc    Create a booking
// @route   POST /api/bookings
const createBooking = async (req, res, next) => {
  try {
    const { propertyId, bookingType, visitDate, moveInDate, moveOutDate, notes } = req.body;

    const property = await Property.findById(propertyId).populate('owner', 'firstName lastName email phone');
    if (!property) {
      throw ApiError.notFound('Property not found.');
    }

    if (!property.isActive || property.status !== 'available') {
      throw ApiError.badRequest('This property is not available for booking.');
    }

    // Customer cannot book their own property
    if (property.owner._id.toString() === req.user._id.toString()) {
      throw ApiError.badRequest('You cannot book your own property.');
    }

    // Check for existing pending/approved booking
    const existingBooking = await Booking.findOne({
      property: propertyId,
      tenant: req.user._id,
      status: { $in: ['pending', 'approved'] },
    });
    if (existingBooking) {
      throw ApiError.conflict('You already have an active booking for this property.');
    }

    // Calculate total amount
    let totalAmount = property.price;
    let duration = null;

    if (bookingType === 'rent' && moveInDate && moveOutDate) {
      const start = new Date(moveInDate);
      const end = new Date(moveOutDate);
      duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24 * 30)); // months
      if (property.priceUnit === 'per_month') {
        totalAmount = property.price * duration;
      } else if (property.priceUnit === 'per_year') {
        totalAmount = (property.price / 12) * duration;
      }
    }

    const depositAmount = bookingType === 'visit' ? 0 : Math.round(totalAmount * 0.1);

    const booking = await Booking.create({
      property: propertyId,
      tenant: req.user._id,
      owner: property.owner._id,
      bookingType,
      visitDate: visitDate || null,
      moveInDate: moveInDate || null,
      moveOutDate: moveOutDate || null,
      duration,
      totalAmount,
      depositAmount,
      notes,
      status: 'pending',
    });

    // Notify owner
    await createNotification({
      user: property.owner._id,
      type: 'booking',
      title: 'New Booking Request',
      message: `${req.user.firstName} ${req.user.lastName} has requested to ${bookingType} your property "${property.title}".`,
      link: `/dashboard/bookings`,
    });

    sendEmail({
      to: property.owner.email,
      subject: 'New Booking Request - Property Manager',
      template: 'bookingReceived',
      data: {
        ownerName: property.owner.firstName,
        propertyTitle: property.title,
        bookingType,
        tenantName: `${req.user.firstName} ${req.user.lastName}`,
        tenantEmail: req.user.email,
        visitDate: visitDate ? new Date(visitDate).toLocaleDateString() : null,
        moveInDate: moveInDate ? new Date(moveInDate).toLocaleDateString() : null,
        dashboardLink: `${process.env.FRONTEND_URL}/dashboard/bookings`,
      },
    }).catch(err => console.error('Email Error:', err));

    const populatedBooking = await Booking.findById(booking._id)
      .populate('property', 'title slug images price listingType')
      .populate('owner', 'firstName lastName phone')
      .populate('tenant', 'firstName lastName email phone');

    res.status(201).json({
      success: true,
      message: 'Booking request submitted successfully.',
      booking: populatedBooking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my bookings (customer)
// @route   GET /api/bookings/my-bookings
const getMyBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { tenant: req.user._id };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('property', 'title slug images price listingType location')
        .populate('owner', 'firstName lastName phone email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Booking.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      bookings,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get booking requests for owner
// @route   GET /api/bookings/owner-requests
const getOwnerRequests = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { owner: req.user._id };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('property', 'title slug images price listingType location')
        .populate('tenant', 'firstName lastName phone email avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Booking.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      bookings,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve booking (owner)
// @route   PATCH /api/bookings/:id/approve
const approveBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('property', 'title slug')
      .populate('tenant', 'firstName lastName email')
      .populate('owner', 'firstName lastName phone');

    if (!booking) {
      throw ApiError.notFound('Booking not found.');
    }

    if (booking.owner._id.toString() !== req.user._id.toString()) {
      throw ApiError.forbidden('You can only manage bookings for your own properties.');
    }

    if (booking.status !== 'pending') {
      throw ApiError.badRequest('Only pending bookings can be approved.');
    }

    booking.status = 'approved';
    await booking.save();

    // Update property status
    if (booking.bookingType !== 'visit') {
      await Property.findByIdAndUpdate(booking.property._id, { status: 'booked' });
    }

    // Notify tenant
    await createNotification({
      user: booking.tenant._id,
      type: 'booking',
      title: 'Booking Approved!',
      message: `Your booking for "${booking.property.title}" has been approved.`,
      link: `/dashboard/bookings`,
    });

    sendEmail({
      to: booking.tenant.email,
      subject: 'Booking Approved! - Property Manager',
      template: 'bookingApproved',
      data: {
        tenantName: booking.tenant.firstName,
        propertyTitle: booking.property.title,
        bookingType: booking.bookingType,
        moveInDate: booking.moveInDate ? new Date(booking.moveInDate).toLocaleDateString() : null,
        ownerPhone: booking.owner.phone,
        dashboardLink: `${process.env.FRONTEND_URL}/dashboard/bookings`,
      },
    }).catch(err => console.error('Email Error:', err));

    res.status(200).json({
      success: true,
      message: 'Booking approved successfully.',
      booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject booking (owner)
// @route   PATCH /api/bookings/:id/reject
const rejectBooking = async (req, res, next) => {
  try {
    const { rejectionReason } = req.body;

    const booking = await Booking.findById(req.params.id)
      .populate('property', 'title slug')
      .populate('tenant', 'firstName lastName email');

    if (!booking) {
      throw ApiError.notFound('Booking not found.');
    }

    if (booking.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      throw ApiError.forbidden('You can only manage bookings for your own properties.');
    }

    if (booking.status !== 'pending') {
      throw ApiError.badRequest('Only pending bookings can be rejected.');
    }

    booking.status = 'rejected';
    booking.rejectionReason = rejectionReason || 'No reason provided';
    await booking.save();

    await createNotification({
      user: booking.tenant._id,
      type: 'booking',
      title: 'Booking Rejected',
      message: `Your booking for "${booking.property.title}" was declined. Reason: ${booking.rejectionReason}`,
      link: `/dashboard/bookings`,
    });

    sendEmail({
      to: booking.tenant.email,
      subject: 'Booking Update - Property Manager',
      template: 'bookingRejected',
      data: {
        tenantName: booking.tenant.firstName,
        propertyTitle: booking.property.title,
        rejectionReason: booking.rejectionReason,
        browseLink: `${process.env.FRONTEND_URL}/properties`,
      },
    }).catch(err => console.error('Email Error:', err));

    res.status(200).json({
      success: true,
      message: 'Booking rejected.',
      booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel booking
// @route   PATCH /api/bookings/:id/cancel
const cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('property', 'title')
      .populate('tenant', 'firstName lastName email')
      .populate('owner', 'firstName lastName email');

    if (!booking) {
      throw ApiError.notFound('Booking not found.');
    }

    const isOwner = booking.owner._id.toString() === req.user._id.toString();
    const isTenant = booking.tenant._id.toString() === req.user._id.toString();

    if (!isOwner && !isTenant) {
      throw ApiError.forbidden('You are not authorized to cancel this booking.');
    }

    if (!['pending', 'approved'].includes(booking.status)) {
      throw ApiError.badRequest('Only pending or approved bookings can be cancelled.');
    }

    // Restore property to available if it was booked
    const property = await Property.findById(booking.property._id);
    if (property && property.status === 'booked') {
      property.status = 'available';
      await property.save({ validateBeforeSave: false });
    }

    booking.status = 'cancelled';
    await booking.save();

    // Notify the other party
    const notifyUserId = isOwner ? booking.tenant._id : booking.owner._id;
    const cancellerName = isOwner
      ? `${booking.owner.firstName} ${booking.owner.lastName}`
      : `${booking.tenant.firstName} ${booking.tenant.lastName}`;

    await createNotification({
      user: notifyUserId,
      type: 'booking',
      title: 'Booking Cancelled',
      message: `Booking for "${booking.property.title}" was cancelled by ${cancellerName}.`,
      link: '/dashboard/bookings',
    });

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully.',
      booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete booking (owner)
// @route   PATCH /api/bookings/:id/complete
const completeBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('property', 'title slug')
      .populate('tenant', 'firstName lastName email');

    if (!booking) {
      throw ApiError.notFound('Booking not found.');
    }

    if (booking.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      throw ApiError.forbidden('You can only manage your own property bookings.');
    }

    if (booking.status !== 'approved') {
      throw ApiError.badRequest('Only approved bookings can be completed.');
    }

    booking.status = 'completed';
    await booking.save();

    // Update property status based on booking type
    const property = await Property.findById(booking.property._id);
    if (property) {
      if (booking.bookingType === 'buy') {
        property.status = 'sold';
      } else if (booking.bookingType === 'rent') {
        property.status = 'rented';
      } else {
        property.status = 'available';
      }
      await property.save({ validateBeforeSave: false });
    }

    // Notify tenant to leave review
    await createNotification({
      user: booking.tenant._id,
      type: 'booking',
      title: 'Booking Completed!',
      message: `Your booking for "${booking.property.title}" is now complete. Please leave a review!`,
      link: `/properties/${booking.property.slug}`,
    });

    res.status(200).json({
      success: true,
      message: 'Booking marked as completed.',
      booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('property', 'title slug images price listingType location amenities')
      .populate('tenant', 'firstName lastName email phone avatar')
      .populate('owner', 'firstName lastName email phone avatar');

    if (!booking) {
      throw ApiError.notFound('Booking not found.');
    }

    // Only owner or tenant can view
    const isOwner = booking.owner._id.toString() === req.user._id.toString();
    const isTenant = booking.tenant._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isTenant && !isAdmin) {
      throw ApiError.forbidden('You are not authorized to view this booking.');
    }

    res.status(200).json({
      success: true,
      booking,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getOwnerRequests,
  approveBooking,
  rejectBooking,
  cancelBooking,
  completeBooking,
  getBookingById,
};
