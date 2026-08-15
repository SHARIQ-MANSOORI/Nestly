const mongoose = require('mongoose');

const reviewReportSchema = new mongoose.Schema(
  {
    review: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review',
      required: [true, 'Review ID is required'],
      index: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID of reporter is required'],
      index: true,
    },
    reason: {
      type: String,
      enum: ['spam', 'harassment', 'offensive', 'fake', 'irrelevant', 'other'],
      required: [true, 'Report reason is required'],
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'dismissed', 'action_taken'],
      default: 'pending',
      index: true,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate reports from same user for same review
reviewReportSchema.index({ review: 1, reportedBy: 1 }, { unique: true });

module.exports = mongoose.model('ReviewReport', reviewReportSchema);
