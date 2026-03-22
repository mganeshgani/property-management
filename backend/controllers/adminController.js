const User = require('../models/User');
const Property = require('../models/Property');
const Booking = require('../models/Booking');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const Payment = require('../models/Payment');
const ApiError = require('../utils/ApiError');

// @desc    Get admin dashboard stats
// @route   GET /api/admin/dashboard
const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      usersByRole,
      totalProperties,
      propertiesByStatus,
      totalBookings,
      bookingsByStatus,
      maintenanceStats,
      recentBookings,
      recentUsers,
      propertiesByCity,
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
      Property.countDocuments({ isActive: true }),
      Property.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Booking.countDocuments(),
      Booking.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      MaintenanceRequest.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      Booking.find()
        .populate('property', 'title slug')
        .populate('tenant', 'firstName lastName email')
        .populate('owner', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      User.find()
        .select('firstName lastName email role createdAt')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      Property.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$location.city', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    // Monthly revenue
    const monthlyRevenue = await Payment.aggregate([
      { $match: { status: 'success' } },
      {
        $group: {
          _id: {
            year: { $year: '$paidAt' },
            month: { $month: '$paidAt' },
          },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        usersByRole,
        totalProperties,
        propertiesByStatus,
        totalBookings,
        bookingsByStatus,
        maintenanceStats,
        monthlyRevenue,
        recentBookings,
        recentUsers,
        propertiesByCity,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (admin)
// @route   GET /api/admin/users
const getAllUsers = async (req, res, next) => {
  try {
    const { role, isActive, isEmailVerified, search, page = 1, limit = 10 } = req.query;
    const query = {};

    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (isEmailVerified !== undefined) query.isEmailVerified = isEmailVerified === 'true';
    if (search) {
      query.$or = [
        { firstName: new RegExp(search, 'i') },
        { lastName: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      users,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle user active status
// @route   PATCH /api/admin/users/:id/toggle-active
const toggleUserActive = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    if (user.role === 'admin') {
      throw ApiError.forbidden('Cannot deactivate an admin account.');
    }

    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: user.isActive ? 'User activated.' : 'User deactivated.',
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change user role
// @route   PATCH /api/admin/users/:id/change-role
const changeUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const PRIMARY_ADMIN_EMAIL = 'admin@test.com';

    if (!['customer', 'owner', 'worker', 'admin'].includes(role)) {
      throw ApiError.badRequest('Invalid role.');
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    if (role === 'admin' && user.email !== PRIMARY_ADMIN_EMAIL) {
      throw ApiError.forbidden(`Only ${PRIMARY_ADMIN_EMAIL} can have admin role.`);
    }

    if (user.email === PRIMARY_ADMIN_EMAIL && role !== 'admin') {
      throw ApiError.forbidden(`Cannot change role for ${PRIMARY_ADMIN_EMAIL}.`);
    }

    user.role = role;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: `User role changed to ${role}.`,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all properties (admin)
// @route   GET /api/admin/properties
const getAdminProperties = async (req, res, next) => {
  try {
    const { status, propertyType, city, owner, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (propertyType) query.propertyType = propertyType;
    if (city) query['location.city'] = new RegExp(city, 'i');
    if (owner) query.owner = owner;

    const skip = (Number(page) - 1) * Number(limit);

    const [properties, total] = await Promise.all([
      Property.find(query)
        .populate('owner', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Property.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      properties,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bookings (admin)
// @route   GET /api/admin/bookings
const getAdminBookings = async (req, res, next) => {
  try {
    const { status, bookingType, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (bookingType) query.bookingType = bookingType;

    const skip = (Number(page) - 1) * Number(limit);

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('property', 'title slug location')
        .populate('tenant', 'firstName lastName email')
        .populate('owner', 'firstName lastName email')
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

// @desc    Get all maintenance (admin)
// @route   GET /api/admin/maintenance
const getAdminMaintenance = async (req, res, next) => {
  try {
    const { status, category, priority, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;

    const skip = (Number(page) - 1) * Number(limit);

    const [requests, total] = await Promise.all([
      MaintenanceRequest.find(query)
        .populate('property', 'title slug')
        .populate('raisedBy', 'firstName lastName email')
        .populate('assignedTo', 'firstName lastName')
        .populate('owner', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      MaintenanceRequest.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      requests,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get analytics data
// @route   GET /api/admin/analytics
const getAnalytics = async (req, res, next) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [
      userGrowth,
      bookingsByMonth,
      propertyTypeDistribution,
      revenueTrend,
      topCities,
      bookingStatusBreakdown,
    ] = await Promise.all([
      // User growth over last 6 months by role
      User.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              role: '$role',
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      // Bookings per month grouped by type
      Booking.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              type: '$bookingType',
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      // Property type distribution
      Property.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$propertyType', count: { $sum: 1 } } },
      ]),
      // Revenue trend
      Payment.aggregate([
        { $match: { status: 'success', paidAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: {
              year: { $year: '$paidAt' },
              month: { $month: '$paidAt' },
            },
            total: { $sum: '$amount' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      // Top 5 cities by listings
      Property.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$location.city', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      // Booking status breakdown
      Booking.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      analytics: {
        userGrowth,
        bookingsByMonth,
        propertyTypeDistribution,
        revenueTrend,
        topCities,
        bookingStatusBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  toggleUserActive,
  changeUserRole,
  getAdminProperties,
  getAdminBookings,
  getAdminMaintenance,
  getAnalytics,
};
