const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const {
  createProperty,
  getProperties,
  getFeaturedProperties,
  getPropertyBySlug,
  getPropertyById,
  updateProperty,
  deleteProperty,
  getMyListings,
  approveProperty,
  rejectProperty,
  toggleFeatured,
} = require('../controllers/propertyController');

const validateProperty = [
  body('title').trim().notEmpty().withMessage('Title is required')
    .isLength({ max: 150 }).withMessage('Title cannot exceed 150 characters'),
  body('description').trim().notEmpty().withMessage('Description is required')
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
  body('propertyType').isIn(['house', 'flat', 'villa', 'plot', 'commercial']).withMessage('Invalid property type'),
  body('listingType').isIn(['sale', 'rent', 'lease']).withMessage('Invalid listing type'),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('area').isNumeric().withMessage('Area must be a number'),
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

// Public routes
router.get('/', getProperties);
router.get('/featured', getFeaturedProperties);

// Owner routes (before :slug to avoid param conflict)
router.get('/owner/my-listings', protect, authorize('owner', 'admin'), getMyListings);

// By-ID route for editing
router.get('/detail/:id', protect, getPropertyById);

// Slug route (must come after named routes)
router.get('/:slug', getPropertyBySlug);
router.post('/', protect, authorize('owner', 'admin'), upload.array('images', 10), validateProperty, handleValidation, createProperty);
router.put('/:id', protect, authorize('owner', 'admin'), upload.array('images', 10), updateProperty);
router.delete('/:id', protect, authorize('owner', 'admin'), deleteProperty);

// Admin routes
router.patch('/:id/approve', protect, authorize('admin'), approveProperty);
router.patch('/:id/reject', protect, authorize('admin'), rejectProperty);
router.patch('/:id/feature', protect, authorize('admin'), toggleFeatured);

module.exports = router;
