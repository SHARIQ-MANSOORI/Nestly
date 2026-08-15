const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.Mixed, // User ObjectId or String 'anonymous'
      ref: 'User',
      index: true,
    },
    actorEmail: {
      type: String,
      default: '',
    },
    action: {
      type: String,
      required: [true, 'Audit action is required'],
      index: true,
    },
    resourceType: {
      type: String,
      required: [true, 'Resource type is required'],
      index: true,
    },
    resourceId: {
      type: String,
      default: '',
      index: true,
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'rejected'],
      default: 'success',
      index: true,
    },
    ip: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// TTL index to automatically prune audit logs after 90 days (Production Compliance)
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
