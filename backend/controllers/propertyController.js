const Property = require('../models/Property');
const ApiError = require('../utils/ApiError');
const { uploadToCloudinary, deleteFromCloudinary, deleteMultipleFromCloudinary } = require('../config/cloudinary');
const sendEmail = require('../utils/sendEmail');
const createNotification = require('../utils/createNotification');
const fs = require('fs');

// @desc    Create a new property
// @route   POST /api/properties
const createProperty = async (req, res, next) => {
  try {
    const {
      title, description, propertyType, listingType,
      price, priceUnit, area, bedrooms, bathrooms, floors,
      furnishing, amenities, location,
    } = req.body;

    // Parse location if it's a string (from multipart form)
    let parsedLocation = location;
    if (typeof location === 'string') {
      parsedLocation = JSON.parse(location);
    }

    // Parse amenities if it's a string
    let parsedAmenities = amenities;
    if (typeof amenities === 'string') {
      parsedAmenities = JSON.parse(amenities);
    }

    // Upload images to Cloudinary
    const images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.path, 'property-management/properties');
        images.push(result);
        fs.unlinkSync(file.path);
      }
    }

    const property = await Property.create({
      title,
      description,
      propertyType,
      listingType,
      price: Number(price),
      priceUnit: priceUnit || 'total',
      area: Number(area),
      bedrooms: Number(bedrooms) || 0,
      bathrooms: Number(bathrooms) || 0,
      floors: Number(floors) || 1,
      furnishing: furnishing || 'unfurnished',
      amenities: parsedAmenities || [],
      location: parsedLocation,
      images,
      owner: req.user._id,
      status: 'pending',
    });

    // Notify admins
    const User = require('../models/User');
    const admins = await User.find({ role: 'admin', isActive: true });
    for (const admin of admins) {
      await createNotification({
        user: admin._id,
        type: 'property',
        title: 'New Property Listing',
        message: `${req.user.firstName} ${req.user.lastName} submitted a new property "${title}" for approval.`,
        link: `/dashboard/admin/properties`,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Property created successfully. Pending admin approval.',
      property,
    });
  } catch (error) {
    // Clean up temp files on error
    if (req.files) {
      for (const file of req.files) {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }
    next(error);
  }
};

// @desc    Get all properties (public, with filters)
// @route   GET /api/properties
const getProperties = async (req, res, next) => {
  try {
    const {
      city, propertyType, listingType, minPrice, maxPrice,
      bedrooms, bathrooms, furnishing, amenities, search,
      sort, page = 1, limit = 12,
    } = req.query;

    const query = { isActive: true, status: 'available' };

    // Filters
    if (city) query['location.city'] = new RegExp(city, 'i');
    if (propertyType) query.propertyType = propertyType;
    if (listingType) query.listingType = listingType;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (bedrooms) query.bedrooms = { $gte: Number(bedrooms) };
    if (bathrooms) query.bathrooms = { $gte: Number(bathrooms) };
    if (furnishing) query.furnishing = furnishing;
    if (amenities) {
      const amenityList = amenities.split(',').map((a) => a.trim());
      query.amenities = { $all: amenityList };
    }

    // Full-text search
    if (search) {
      query.$text = { $search: search };
    }

    // Sorting
    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { price: 1 };
    else if (sort === 'price_desc') sortOption = { price: -1 };
    else if (sort === 'newest') sortOption = { createdAt: -1 };
    else if (sort === 'oldest') sortOption = { createdAt: 1 };
    else if (sort === 'most_viewed') sortOption = { views: -1 };

    const skip = (Number(page) - 1) * Number(limit);

    const [properties, total] = await Promise.all([
      Property.find(query)
        .populate('owner', 'firstName lastName avatar')
        .sort(sortOption)
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

// @desc    Get featured properties
// @route   GET /api/properties/featured
const getFeaturedProperties = async (req, res, next) => {
  try {
    const properties = await Property.find({
      isFeatured: true,
      isActive: true,
      status: 'available',
    })
      .populate('owner', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    res.status(200).json({
      success: true,
      properties,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get property by slug
// @route   GET /api/properties/:slug
const getPropertyBySlug = async (req, res, next) => {
  try {
    const property = await Property.findOne({
      slug: req.params.slug,
      isActive: true,
    }).populate('owner', 'firstName lastName phone avatar');

    if (!property) {
      throw ApiError.notFound('Property not found.');
    }

    // Increment view count (debounced per session via frontend)
    property.views += 1;
    await property.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      property,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update property
// @route   PUT /api/properties/:id
const updateProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      throw ApiError.notFound('Property not found.');
    }

    // Check ownership
    if (property.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      throw ApiError.forbidden('You can only update your own properties.');
    }

    const updateData = { ...req.body };

    // Parse JSON fields from multipart form
    if (typeof updateData.location === 'string') {
      updateData.location = JSON.parse(updateData.location);
    }
    if (typeof updateData.amenities === 'string') {
      updateData.amenities = JSON.parse(updateData.amenities);
    }

    // Handle removed images
    if (updateData.removedImages) {
      let removedImages;
      if (Array.isArray(updateData.removedImages)) {
        removedImages = updateData.removedImages;
      } else if (typeof updateData.removedImages === 'string') {
        try {
          const parsed = JSON.parse(updateData.removedImages);
          removedImages = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          removedImages = [updateData.removedImages];
        }
      } else {
        removedImages = [updateData.removedImages];
      }

      for (const publicId of removedImages) {
        await deleteFromCloudinary(publicId);
      }
      updateData.images = property.images.filter(
        (img) => !removedImages.includes(img.publicId)
      );
      delete updateData.removedImages;
    }

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      const newImages = [];
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.path, 'property-management/properties');
        newImages.push(result);
        fs.unlinkSync(file.path);
      }
      updateData.images = [...(updateData.images || property.images), ...newImages];
    }

    // Convert numeric fields
    if (updateData.price) updateData.price = Number(updateData.price);
    if (updateData.area) updateData.area = Number(updateData.area);
    if (updateData.bedrooms) updateData.bedrooms = Number(updateData.bedrooms);
    if (updateData.bathrooms) updateData.bathrooms = Number(updateData.bathrooms);
    if (updateData.floors) updateData.floors = Number(updateData.floors);

    const updatedProperty = await Property.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('owner', 'firstName lastName avatar');

    res.status(200).json({
      success: true,
      message: 'Property updated successfully.',
      property: updatedProperty,
    });
  } catch (error) {
    if (req.files) {
      for (const file of req.files) {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }
    }
    next(error);
  }
};

// @desc    Delete property (soft delete)
// @route   DELETE /api/properties/:id
const deleteProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      throw ApiError.notFound('Property not found.');
    }

    if (property.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      throw ApiError.forbidden('You can only delete your own properties.');
    }

    // Delete images from Cloudinary
    if (property.images && property.images.length > 0) {
      const publicIds = property.images.map((img) => img.publicId);
      await deleteMultipleFromCloudinary(publicIds);
    }

    property.isActive = false;
    await property.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Property deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my listings (owner)
// @route   GET /api/properties/owner/my-listings
const getMyListings = async (req, res, next) => {
  try {
    const Booking = require('../models/Booking');
    const properties = await Property.find({
      owner: req.user._id,
      isActive: true,
    }).sort({ createdAt: -1 }).lean();

    // Count bookings for each property
    const propertiesWithBookings = await Promise.all(
      properties.map(async (property) => {
        const bookingCount = await Booking.countDocuments({ property: property._id });
        return { ...property, bookingCount };
      })
    );

    res.status(200).json({
      success: true,
      properties: propertiesWithBookings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve property (admin)
// @route   PATCH /api/properties/:id/approve
const approveProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id).populate('owner', 'firstName lastName email');
    if (!property) {
      throw ApiError.notFound('Property not found.');
    }

    property.status = 'available';
    await property.save({ validateBeforeSave: false });

    // Notify owner
    await createNotification({
      user: property.owner._id,
      type: 'property',
      title: 'Property Approved',
      message: `Your property "${property.title}" has been approved and is now live.`,
      link: `/properties/${property.slug}`,
    });

    await sendEmail({
      to: property.owner.email,
      subject: 'Property Listing Approved! - Property Manager',
      template: 'propertyApproved',
      data: {
        ownerName: property.owner.firstName,
        propertyTitle: property.title,
        propertyType: property.propertyType,
        listingType: property.listingType,
        propertyLink: `${process.env.FRONTEND_URL}/properties/${property.slug}`,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Property approved successfully.',
      property,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject property (admin)
// @route   PATCH /api/properties/:id/reject
const rejectProperty = async (req, res, next) => {
  try {
    const { rejectionReason } = req.body;
    if (!rejectionReason) {
      throw ApiError.badRequest('Rejection reason is required.');
    }

    const property = await Property.findById(req.params.id).populate('owner', 'firstName lastName email');
    if (!property) {
      throw ApiError.notFound('Property not found.');
    }

    property.status = 'rejected';
    property.rejectionReason = rejectionReason;
    await property.save({ validateBeforeSave: false });

    await createNotification({
      user: property.owner._id,
      type: 'property',
      title: 'Property Rejected',
      message: `Your property "${property.title}" was not approved. Reason: ${rejectionReason}`,
      link: `/dashboard/owner/properties`,
    });

    await sendEmail({
      to: property.owner.email,
      subject: 'Property Listing Update - Property Manager',
      template: 'propertyRejected',
      data: {
        ownerName: property.owner.firstName,
        propertyTitle: property.title,
        rejectionReason,
        dashboardLink: `${process.env.FRONTEND_URL}/dashboard/owner/properties`,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Property rejected.',
      property,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle featured status (admin)
// @route   PATCH /api/properties/:id/feature
const toggleFeatured = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      throw ApiError.notFound('Property not found.');
    }

    property.isFeatured = !property.isFeatured;
    await property.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: property.isFeatured ? 'Property marked as featured.' : 'Property removed from featured.',
      property,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get property by ID (for editing)
// @route   GET /api/properties/detail/:id
const getPropertyById = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('owner', 'firstName lastName phone avatar');

    if (!property) {
      throw ApiError.notFound('Property not found.');
    }

    res.status(200).json({
      success: true,
      data: property,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
