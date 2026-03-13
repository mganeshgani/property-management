const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createBooking,
  getMyBookings,
  getOwnerRequests,
  approveBooking,
  rejectBooking,
  cancelBooking,
  completeBooking,
  getBookingById,
} = require('../controllers/bookingController');

const validateBooking = [
  body('propertyId').notEmpty().withMessage('Property ID is required'),
  body('bookingType').isIn(['buy', 'rent', 'visit']).withMessage('Invalid booking type'),
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

// Customer routes
router.post('/', protect, authorize('customer'), validateBooking, handleValidation, createBooking);
router.get('/my-bookings', protect, authorize('customer'), getMyBookings);

// Owner routes
router.get('/owner-requests', protect, authorize('owner'), getOwnerRequests);
router.patch('/:id/approve', protect, authorize('owner'), approveBooking);
router.patch('/:id/reject', protect, authorize('owner'), rejectBooking);
router.patch('/:id/complete', protect, authorize('owner', 'admin'), completeBooking);

// Both can cancel
router.patch('/:id/cancel', protect, cancelBooking);

// Get single booking
router.get('/:id', protect, getBookingById);

module.exports = router;
