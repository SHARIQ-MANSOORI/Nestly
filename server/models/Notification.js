const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient user ID is required'],
      index: true,
    },
    type: {
      type: String,
      enum: [
        'BOOKING_CREATED',
        'BOOKING_CONFIRMED',
        'BOOKING_CANCELLED',
        'BOOKING_EXPIRED',
        'PAYMENT_SUCCESS',
        'PAYMENT_FAILED',
        'PAYMENT_REFUND',
        'MANAGER_NEW_BOOKING',
        'MANAGER_BOOKING_CANCELLED',
      ],
      required: [true, 'Notification type is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
    },
    channel: {
      type: String,
      enum: ['in_app', 'email'],
      default: 'in_app',
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast queries on user's unread & recent notifications
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
