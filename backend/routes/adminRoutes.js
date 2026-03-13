const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getDashboardStats,
  getAllUsers,
  toggleUserActive,
  changeUserRole,
  getAdminProperties,
  getAdminBookings,
  getAdminMaintenance,
  getAnalytics,
} = require('../controllers/adminController');

// All admin routes require auth + admin role
router.use(protect, authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/users', getAllUsers);
router.patch('/users/:id/toggle-active', toggleUserActive);
router.patch('/users/:id/change-role', changeUserRole);
router.get('/properties', getAdminProperties);
router.get('/bookings', getAdminBookings);
router.get('/maintenance', getAdminMaintenance);
router.get('/analytics', getAnalytics);

module.exports = router;
