const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: [true, 'Associated hotel ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Room name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Room description is required'],
    },
    type: {
      type: String,
      enum: ['Standard', 'Deluxe', 'Executive Suite', 'Presidential Suite', 'Family Room', 'Villa'],
      default: 'Deluxe',
    },
    pricePerNight: {
      type: Number,
      required: [true, 'Price per night is required'],
      min: [0, 'Price per night must be non-negative'],
    },
    capacity: {
      type: Number,
      required: [true, 'Guest capacity is required'],
      min: [1, 'Capacity must be at least 1 guest'],
      default: 2,
    },
    amenities: {
      type: [String],
      default: [],
    },
    images: {
      type: [String],
      default: [],
    },
    totalRooms: {
      type: Number,
      default: 10,
      min: 1,
    },
    status: {
      type: String,
      enum: ['available', 'inactive', 'maintenance'],
      default: 'available',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Room', roomSchema);
