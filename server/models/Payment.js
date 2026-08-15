const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Associated booking ID is required'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer ID is required'],
      index: true,
    },
    provider: {
      type: String,
      default: 'razorpay',
    },
    providerOrderId: {
      type: String,
      index: true,
      trim: true,
    },
    providerPaymentId: {
      type: String,
      index: true,
      trim: true,
    },
    providerSignature: {
      type: String,
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0, 'Amount must be non-negative'],
    },
    amountInSubunits: {
      type: Number,
      required: [true, 'Amount in subunits (paise) is required'],
      min: [0, 'Subunits must be non-negative'],
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
    },
    status: {
      type: String,
      enum: ['created', 'pending', 'paid', 'failed', 'cancelled', 'refunded', 'partially_refunded'],
      default: 'created',
      index: true,
    },
    method: {
      type: String,
      default: 'online_gateway',
    },
    failureReason: {
      type: String,
      default: '',
    },
    paidAt: {
      type: Date,
    },
    refundStatus: {
      type: String,
      enum: ['not_applicable', 'eligible', 'requested', 'processing', 'refunded'],
      default: 'not_applicable',
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    refundedAt: {
      type: Date,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Payment', paymentSchema);
