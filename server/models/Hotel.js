const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Hotel name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Hotel description is required'],
    },
    location: {
      type: String,
      required: [true, 'Detailed location string is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      index: true,
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      default: 'India',
      trim: true,
    },
    images: {
      type: [String],
      required: [true, 'At least one hotel image URL is required'],
      validate: [arr => arr.length > 0, 'Hotel must have at least one image'],
    },
    amenities: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      default: 4.5,
      min: 0,
      max: 5,
      index: true,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    startingPrice: {
      type: Number,
      required: [true, 'Starting price per night is required'],
      min: 0,
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Optional in Phase 1 seed
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for search optimization
hotelSchema.index({ name: 'text', city: 'text', location: 'text' });

module.exports = mongoose.model('Hotel', hotelSchema);
