const analyticsService = require('../services/analyticsService');

// @desc    Get Manager Analytics Overview (Net revenue, Occupancy %, ADR, RevPAR, Room performance, Trends)
// @route   GET /api/analytics/manager/overview
// @access  Private (Manager / Admin)
const getManagerOverview = async (req, res, next) => {
  try {
    const { filter = '30d', from, to } = req.query;

    const data = await analyticsService.getManagerOverview(
      req.user._id,
      filter,
      from,
      to
    );

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Admin Platform Analytics Overview (Total Revenue, Total Bookings, Active Hotels, Top Hotels)
// @route   GET /api/analytics/admin/overview
// @access  Private (Admin)
const getAdminOverview = async (req, res, next) => {
  try {
    const { filter = '30d', from, to } = req.query;

    const data = await analyticsService.getAdminOverview(filter, from, to);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getManagerOverview,
  getAdminOverview,
};
