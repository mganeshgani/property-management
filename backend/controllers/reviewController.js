const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Property = require('../models/Property');
const ApiError = require('../utils/ApiError');

// @desc    Create a review
// @route   POST /api/reviews
const createReview = async (req, res, next) => {
  try {
    const { propertyId, bookingId, rating, comment } = req.body;

    // Check booking exists and is completed
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw ApiError.notFound('Booking not found.');
    }

    if (booking.tenant.toString() !== req.user._id.toString()) {
      throw ApiError.forbidden('You can only review your own bookings.');
    }

    if (booking.status !== 'completed') {
      throw ApiError.badRequest('You can only review completed bookings.');
    }

    if (booking.property.toString() !== propertyId) {
      throw ApiError.badRequest('Booking does not match the property.');
    }

    // Check for existing review
    const existingReview = await Review.findOne({
      property: propertyId,
      reviewer: req.user._id,
      booking: bookingId,
    });

    if (existingReview) {
      throw ApiError.conflict('You have already reviewed this booking.');
    }

    const review = await Review.create({
      property: propertyId,
      reviewer: req.user._id,
      booking: bookingId,
      rating,
      comment,
    });

    const populatedReview = await Review.findById(review._id)
      .populate('reviewer', 'firstName lastName avatar');

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully.',
      review: populatedReview,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reviews for a property
// @route   GET /api/reviews/property/:propertyId
const getPropertyReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [reviews, total] = await Promise.all([
      Review.find({
        property: req.params.propertyId,
        isVisible: true,
      })
        .populate('reviewer', 'firstName lastName avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Review.countDocuments({
        property: req.params.propertyId,
        isVisible: true,
      }),
    ]);

    // Calculate average rating
    const avgResult = await Review.aggregate([
      { $match: { property: require('mongoose').Types.ObjectId.createFromHexString(req.params.propertyId), isVisible: true } },
      { $group: { _id: null, averageRating: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);

    const averageRating = avgResult.length > 0 ? Math.round(avgResult[0].averageRating * 10) / 10 : 0;
    const totalReviews = avgResult.length > 0 ? avgResult[0].count : 0;

    res.status(200).json({
      success: true,
      reviews,
      averageRating,
      totalReviews,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      throw ApiError.notFound('Review not found.');
    }

    // Only admin or review author can delete
    if (review.reviewer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      throw ApiError.forbidden('You can only delete your own reviews.');
    }

    await Review.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getPropertyReviews,
  deleteReview,
};
