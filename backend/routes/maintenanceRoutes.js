const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const {
  createMaintenanceRequest,
  getMyRequests,
  getWorkerTasks,
  getOwnerMaintenanceRequests,
  assignWorker,
  startMaintenance,
  completeMaintenance,
  closeMaintenance,
  getAllMaintenanceRequests,
} = require('../controllers/maintenanceController');

const validateMaintenance = [
  body('propertyId').notEmpty().withMessage('Property ID is required'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category').isIn(['plumbing', 'electrical', 'carpentry', 'painting', 'cleaning', 'other']).withMessage('Invalid category'),
];

const handleValidation = (req, res, next) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: errors.array().map((e) => e.msg),
    });
  }
  next();
};

// Admin route (must be before parameterized routes)
router.get('/', protect, authorize('admin'), getAllMaintenanceRequests);

// Customer routes
router.post('/', protect, authorize('customer'), upload.array('images', 5), validateMaintenance, handleValidation, createMaintenanceRequest);
router.get('/my-requests', protect, authorize('customer'), getMyRequests);

// Worker routes
router.get('/worker-tasks', protect, authorize('worker'), getWorkerTasks);
router.patch('/:id/start', protect, authorize('worker'), startMaintenance);
router.patch('/:id/complete', protect, authorize('worker'), completeMaintenance);

// Owner routes
router.get('/owner-requests', protect, authorize('owner'), getOwnerMaintenanceRequests);
router.get('/workers', protect, authorize('owner', 'admin'), async (req, res) => {
  const User = require('../models/User');
  try {
    const workers = await User.find({ role: 'worker', isActive: true }).select('firstName lastName email phone');
    res.json({ success: true, workers });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch workers' });
  }
});
router.patch('/:id/assign', protect, authorize('owner', 'admin'), assignWorker);
router.patch('/:id/close', protect, authorize('owner', 'admin'), closeMaintenance);

module.exports = router;
