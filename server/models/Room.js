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
      min: 0,
    },
    capacity: {
      type: Number,
      required: [true, 'Guest capacity is required'],
      min: 1,
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
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Room', roomSchema);
