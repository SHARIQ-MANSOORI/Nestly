const AuditLog = require('../models/AuditLog');

const auditService = {
  /**
   * Log Security & Administrative Action Asynchronously
   */
  logEvent: async ({
    actor = 'anonymous',
    actorEmail = '',
    action,
    resourceType,
    resourceId = '',
    status = 'success',
    req = null,
    metadata = {},
  }) => {
    try {
      let ip = '';
      let userAgent = '';

      if (req) {
        ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '';
        userAgent = req.headers['user-agent'] || '';
        if (!actor && req.user) actor = req.user._id;
        if (!actorEmail && req.user) actorEmail = req.user.email;
      }

      // Sanitize metadata to exclude password/sensitive fields
      const cleanMetadata = { ...metadata };
      delete cleanMetadata.password;
      delete cleanMetadata.currentPassword;
      delete cleanMetadata.newPassword;
      delete cleanMetadata.token;

      await AuditLog.create({
        actor,
        actorEmail,
        action,
        resourceType,
        resourceId: resourceId ? resourceId.toString() : '',
        status,
        ip,
        userAgent,
        metadata: cleanMetadata,
      });
    } catch (err) {
      // Quiet fail audit log errors so business transactions never fail due to logging
      console.error('[AuditLog Error]', err.message);
    }
  },

  /**
   * Admin Query Audit Logs
   */
  getAuditLogs: async (page = 1, limit = 20, filters = {}) => {
    const query = {};
    if (filters.action) query.action = filters.action;
    if (filters.resourceType) query.resourceType = filters.resourceType;
    if (filters.status) query.status = filters.status;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return {
      logs,
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    };
  },
};

module.exports = auditService;
