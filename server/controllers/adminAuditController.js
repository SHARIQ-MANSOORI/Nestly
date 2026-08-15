const auditService = require('../services/auditService');

// @desc    Get Security Audit Trail Logs
// @route   GET /api/admin/audit-logs
// @access  Private (Admin)
const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, action, resourceType, status } = req.query;

    const data = await auditService.getAuditLogs(page, limit, { action, resourceType, status });

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAuditLogs,
};
