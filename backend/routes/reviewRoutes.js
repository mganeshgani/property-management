const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createReview,
  getPropertyReviews,
  deleteReview,
} = require('../controllers/reviewController');

const validateReview = [
  body('propertyId').notEmpty().withMessage('Property ID is required'),
  body('bookingId').notEmpty().withMessage('Booking ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').trim().notEmpty().withMessage('Comment is required')
    .isLength({ max: 500 }).withMessage('Comment cannot exceed 500 characters'),
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

// Public route
router.get('/property/:propertyId', getPropertyReviews);

// Customer route
router.post('/', protect, authorize('customer'), validateReview, handleValidation, createReview);

// Delete (customer own or admin)
router.delete('/:id', protect, deleteReview);

module.exports = router;
