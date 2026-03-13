const mongoose = require('mongoose');
const slugify = require('slugify');

const propertySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Property title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    propertyType: {
      type: String,
      required: [true, 'Property type is required'],
      enum: ['house', 'flat', 'villa', 'plot', 'commercial'],
    },
    listingType: {
      type: String,
      required: [true, 'Listing type is required'],
      enum: ['sale', 'rent', 'lease'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    priceUnit: {
      type: String,
      enum: ['total', 'per_month', 'per_year'],
      default: 'total',
    },
    area: {
      type: Number,
      required: [true, 'Area is required'],
      min: [1, 'Area must be at least 1 sqft'],
    },
    bedrooms: {
      type: Number,
      default: 0,
      min: 0,
    },
    bathrooms: {
      type: Number,
      default: 0,
      min: 0,
    },
    floors: {
      type: Number,
      default: 1,
      min: 1,
    },
    furnishing: {
      type: String,
      enum: ['furnished', 'semi', 'unfurnished'],
      default: 'unfurnished',
    },
    amenities: [
      {
        type: String,
        trim: true,
      },
    ],
    location: {
      address: { type: String, required: [true, 'Address is required'], trim: true },
      city: { type: String, required: [true, 'City is required'], trim: true },
      state: { type: String, required: [true, 'State is required'], trim: true },
      pincode: { type: String, required: [true, 'Pincode is required'], trim: true },
      country: { type: String, trim: true, default: 'India' },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'available', 'booked', 'sold', 'rented', 'rejected'],
      default: 'pending',
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
propertySchema.index({ 'location.city': 1 });
propertySchema.index({ propertyType: 1 });
propertySchema.index({ listingType: 1 });
propertySchema.index({ price: 1 });
propertySchema.index({ status: 1, isActive: 1 });
propertySchema.index({ title: 'text', description: 'text', 'location.address': 'text', 'location.city': 'text' });

// Generate slug before save
propertySchema.pre('save', async function () {
  if (this.isModified('title') || this.isNew) {
    let baseSlug = slugify(this.title, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;
    while (await mongoose.model('Property').findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    this.slug = slug;
  }
});

module.exports = mongoose.model('Property', propertySchema);
