const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking ID is required'],
      unique: true, // One review per reservation
      index: true,
    },
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: [true, 'Hotel ID is required'],
      index: true,
    },
    rating: {
      type: Number,
      required: [true, 'Overall rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
      validate: {
        validator: Number.isInteger,
        message: 'Rating must be an integer from 1 to 5',
      },
    },
    title: {
      type: String,
      maxlength: [100, 'Title cannot exceed 100 characters'],
      trim: true,
      default: '',
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      minlength: [10, 'Review comment must be at least 10 characters long'],
      maxlength: [2000, 'Review comment cannot exceed 2000 characters'],
      trim: true,
    },
    categories: {
      cleanliness: { type: Number, min: 1, max: 5 },
      location: { type: Number, min: 1, max: 5 },
      service: { type: Number, min: 1, max: 5 },
      value: { type: Number, min: 1, max: 5 },
    },
    managerResponse: {
      comment: { type: String, maxlength: 1000, trim: true },
      respondedAt: { type: Date },
      respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    status: {
      type: String,
      enum: ['published', 'hidden', 'reported', 'removed'],
      default: 'published',
      index: true,
    },
    isVerifiedStay: {
      type: Boolean,
      default: true,
    },
    reportCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound Index for public hotel reviews query
reviewSchema.index({ hotel: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
