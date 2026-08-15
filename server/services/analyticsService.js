const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Hotel = require('../models/Hotel');
const Room = require('../models/Room');
const User = require('../models/User');

/**
 * Date Range Helper: Converts filter preset or custom dates to JavaScript Date objects
 */
const getDateRangeBoundaries = (filter = '30d', fromStr = null, toStr = null) => {
  const now = new Date();
  let endDate = new Date(now);
  endDate.setHours(23, 59, 59, 999);

  let startDate = new Date(now);
  startDate.setHours(0, 0, 0, 0);

  switch (filter) {
    case 'today':
      break;
    case 'yesterday':
      startDate.setDate(startDate.getDate() - 1);
      endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
      break;
    case '7d':
      startDate.setDate(startDate.getDate() - 6);
      break;
    case '30d':
      startDate.setDate(startDate.getDate() - 29);
      break;
    case 'this_month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'last_month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    case 'this_year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    case 'custom':
      if (fromStr) {
        startDate = new Date(fromStr);
        startDate.setHours(0, 0, 0, 0);
      }
      if (toStr) {
        endDate = new Date(toStr);
        endDate.setHours(23, 59, 59, 999);
      }
      break;
    default:
      startDate.setDate(startDate.getDate() - 29);
      break;
  }

  // Calculate number of days in the selected range (minimum 1 day)
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const numberOfDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  return { startDate, endDate, numberOfDays };
};

const analyticsService = {
  // Manager Overview Analytics
  getManagerOverview: async (managerId, filter = '30d', fromStr = null, toStr = null) => {
    const { startDate, endDate, numberOfDays } = getDateRangeBoundaries(filter, fromStr, toStr);

    // 1. Resolve manager's owned hotels
    const managerHotels = await Hotel.find({ owner: managerId }).select('_id name');
    const hotelIds = managerHotels.map((h) => h._id);

    if (hotelIds.length === 0) {
      return {
        dateRange: { filter, startDate, endDate, numberOfDays },
        kpis: {
          grossRevenue: 0,
          refunds: 0,
          netRevenue: 0,
          totalBookings: 0,
          confirmedBookings: 0,
          completedBookings: 0,
          cancelledBookings: 0,
          pendingBookings: 0,
          expiredBookings: 0,
          occupancyRate: 0,
          adr: 0,
          revpar: 0,
          averageStay: 0,
          averageBookingValue: 0,
          cancellationRate: 0,
        },
        revenueTrends: [],
        bookingTrends: [],
        roomPerformance: [],
        upcomingStays: [],
        recentTransactions: [],
      };
    }

    // 2. Calculate available room nights across active manager rooms
    const activeRooms = await Room.find({ hotel: { $in: hotelIds }, status: 'available' }).select('totalRooms hotel name type');
    const totalPhysicalRooms = activeRooms.reduce((sum, r) => sum + (r.totalRooms || 1), 0);
    const availableRoomNights = totalPhysicalRooms * numberOfDays;

    // 3. MongoDB Aggregation Pipeline on Booking
    const bookingAggregation = await Booking.aggregate([
      {
        $match: {
          hotel: { $in: hotelIds },
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $facet: {
          // Status breakdown
          statusCounts: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
              },
            },
          ],
          // Revenue and Night Metrics for active stays
          activeMetrics: [
            {
              $match: {
                status: { $in: ['confirmed', 'completed'] },
              },
            },
            {
              $group: {
                _id: null,
                grossRevenue: { $sum: '$totalAmount' },
                bookedRoomNights: {
                  $sum: { $multiply: ['$numberOfNights', '$roomsBooked'] },
                },
                confirmedCount: { $sum: 1 },
              },
            },
          ],
          // Daily Trends
          dailyTrends: [
            {
              $group: {
                _id: {
                  $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                },
                revenue: {
                  $sum: {
                    $cond: [
                      { $in: ['$status', ['confirmed', 'completed']] },
                      '$totalAmount',
                      0,
                    ],
                  },
                },
                bookings: { $sum: 1 },
                confirmedBookings: {
                  $sum: {
                    $cond: [{ $in: ['$status', ['confirmed', 'completed']] }, 1, 0],
                  },
                },
              },
            },
            { $sort: { _id: 1 } },
          ],
          // Room Performance breakdown
          roomPerformance: [
            {
              $match: {
                status: { $in: ['confirmed', 'completed'] },
              },
            },
            {
              $group: {
                _id: '$room',
                revenue: { $sum: '$totalAmount' },
                bookings: { $sum: 1 },
                bookedRoomNights: {
                  $sum: { $multiply: ['$numberOfNights', '$roomsBooked'] },
                },
              },
            },
            {
              $lookup: {
                from: 'rooms',
                localField: '_id',
                foreignField: '_id',
                as: 'roomInfo',
              },
            },
            { $unwind: '$roomInfo' },
            {
              $project: {
                roomId: '$_id',
                name: '$roomInfo.name',
                type: '$roomInfo.type',
                totalRooms: '$roomInfo.totalRooms',
                revenue: 1,
                bookings: 1,
                bookedRoomNights: 1,
              },
            },
            { $sort: { revenue: -1 } },
          ],
        },
      },
    ]);

    const facetResults = bookingAggregation[0] || {};
    const statusMap = {};
    (facetResults.statusCounts || []).forEach((item) => {
      statusMap[item._id] = item.count;
    });

    const totalBookings = Object.values(statusMap).reduce((a, b) => a + b, 0);
    const confirmedCount = statusMap.confirmed || 0;
    const completedCount = statusMap.completed || 0;
    const cancelledCount = statusMap.cancelled || 0;
    const pendingCount = statusMap.pending || 0;
    const expiredCount = statusMap.expired || 0;
    const activeStayCount = confirmedCount + completedCount;

    const activeStats = facetResults.activeMetrics[0] || { grossRevenue: 0, bookedRoomNights: 0 };
    const grossRevenue = activeStats.grossRevenue || 0;
    const bookedRoomNights = activeStats.bookedRoomNights || 0;

    // 4. Calculate refunds from Payment model
    const paymentRefundStats = await Payment.aggregate([
      {
        $match: {
          user: { $exists: true },
          createdAt: { $gte: startDate, $lte: endDate },
          refundStatus: 'processed',
        },
      },
      {
        $group: {
          _id: null,
          totalRefunds: { $sum: '$refundAmount' },
        },
      },
    ]);

    const refunds = paymentRefundStats[0]?.totalRefunds || 0;
    const netRevenue = Math.max(0, grossRevenue - refunds);

    // 5. Derived KPI Metrics
    const occupancyRate = availableRoomNights > 0
      ? Number(((bookedRoomNights / availableRoomNights) * 100).toFixed(1))
      : 0;

    const adr = bookedRoomNights > 0 ? Math.round(grossRevenue / bookedRoomNights) : 0;
    const revpar = availableRoomNights > 0 ? Math.round(grossRevenue / availableRoomNights) : 0;
    const averageStay = activeStayCount > 0 ? Number((bookedRoomNights / activeStayCount).toFixed(1)) : 0;
    const averageBookingValue = activeStayCount > 0 ? Math.round(netRevenue / activeStayCount) : 0;
    const cancellationRate = totalBookings > 0 ? Number(((cancelledCount / totalBookings) * 100).toFixed(1)) : 0;

    // 6. Upcoming Stays Widget (Next 5 upcoming reservations)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const upcomingStays = await Booking.find({
      hotel: { $in: hotelIds },
      checkIn: { $gte: todayStart },
      status: 'confirmed',
    })
      .populate('user', 'name email profileImage')
      .populate('room', 'name type')
      .populate('hotel', 'name')
      .sort({ checkIn: 1 })
      .limit(5);

    // 7. Recent Verified Payments Widget
    const recentTransactions = await Payment.find({
      status: 'paid',
    })
      .populate({
        path: 'booking',
        match: { hotel: { $in: hotelIds } },
        populate: [
          { path: 'user', select: 'name email' },
          { path: 'hotel', select: 'name' },
        ],
      })
      .sort({ paidAt: -1, createdAt: -1 })
      .limit(5);

    const filteredRecentTransactions = recentTransactions
      .filter((p) => p.booking !== null)
      .map((p) => ({
        paymentId: p._id,
        bookingReference: p.booking?.bookingReference || 'N/A',
        guestName: p.booking?.user?.name || 'Guest',
        hotelName: p.booking?.hotel?.name || 'Hotel',
        amount: p.amount,
        status: p.status,
        paidAt: p.paidAt || p.createdAt,
      }));

    // 8. Room performance list with occupancy
    const roomPerformance = (facetResults.roomPerformance || []).map((rp) => {
      const roomAvailNights = (rp.totalRooms || 1) * numberOfDays;
      const roomOccupancy = roomAvailNights > 0 ? Math.min(100, Number(((rp.bookedRoomNights / roomAvailNights) * 100).toFixed(1))) : 0;
      return {
        ...rp,
        occupancy: roomOccupancy,
      };
    });

    return {
      dateRange: { filter, startDate, endDate, numberOfDays },
      kpis: {
        grossRevenue,
        refunds,
        netRevenue,
        totalBookings,
        confirmedBookings: confirmedCount,
        completedBookings: completedCount,
        cancelledBookings: cancelledCount,
        pendingBookings: pendingCount,
        expiredBookings: expiredCount,
        occupancyRate,
        adr,
        revpar,
        averageStay,
        averageBookingValue,
        cancellationRate,
      },
      revenueTrends: facetResults.dailyTrends || [],
      bookingTrends: facetResults.dailyTrends || [],
      roomPerformance,
      upcomingStays,
      recentTransactions: filteredRecentTransactions,
    };
  },

  // Admin Platform-Wide Analytics
  getAdminOverview: async (filter = '30d', fromStr = null, toStr = null) => {
    const { startDate, endDate, numberOfDays } = getDateRangeBoundaries(filter, fromStr, toStr);

    // Counts
    const totalHotels = await Hotel.countDocuments();
    const activeHotels = await Hotel.countDocuments({ status: 'active' });
    const totalRooms = await Room.countDocuments({ status: 'available' });
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalManagers = await User.countDocuments({ role: 'manager' });

    // Platform Bookings & Revenue Aggregation
    const platformAggregation = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $facet: {
          statusCounts: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
              },
            },
          ],
          revenueMetrics: [
            {
              $match: { status: { $in: ['confirmed', 'completed'] } },
            },
            {
              $group: {
                _id: null,
                grossRevenue: { $sum: '$totalAmount' },
                totalNights: { $sum: { $multiply: ['$numberOfNights', '$roomsBooked'] } },
              },
            },
          ],
          monthlyTrends: [
            {
              $group: {
                _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                revenue: {
                  $sum: {
                    $cond: [{ $in: ['$status', ['confirmed', 'completed']] }, '$totalAmount', 0],
                  },
                },
                bookings: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
          topHotels: [
            {
              $match: { status: { $in: ['confirmed', 'completed'] } },
            },
            {
              $group: {
                _id: '$hotel',
                revenue: { $sum: '$totalAmount' },
                bookings: { $sum: 1 },
              },
            },
            { $sort: { revenue: -1 } },
            { $limit: 5 },
            {
              $lookup: {
                from: 'hotels',
                localField: '_id',
                foreignField: '_id',
                as: 'hotelInfo',
              },
            },
            { $unwind: '$hotelInfo' },
            {
              $project: {
                hotelId: '$_id',
                name: '$hotelInfo.name',
                city: '$hotelInfo.city',
                revenue: 1,
                bookings: 1,
              },
            },
          ],
        },
      },
    ]);

    const facetResults = platformAggregation[0] || {};
    const statusMap = {};
    (facetResults.statusCounts || []).forEach((item) => {
      statusMap[item._id] = item.count;
    });

    const totalBookings = Object.values(statusMap).reduce((a, b) => a + b, 0);
    const confirmedCount = statusMap.confirmed || 0;
    const completedCount = statusMap.completed || 0;
    const cancelledCount = statusMap.cancelled || 0;
    const activeStayCount = confirmedCount + completedCount;

    const grossRevenue = facetResults.revenueMetrics[0]?.grossRevenue || 0;
    const cancellationRate = totalBookings > 0 ? Number(((cancelledCount / totalBookings) * 100).toFixed(1)) : 0;
    const averageBookingValue = activeStayCount > 0 ? Math.round(grossRevenue / activeStayCount) : 0;

    return {
      dateRange: { filter, startDate, endDate, numberOfDays },
      kpis: {
        totalHotels,
        activeHotels,
        totalRooms,
        totalCustomers,
        totalManagers,
        totalBookings,
        grossRevenue,
        cancellationRate,
        averageBookingValue,
      },
      monthlyTrends: facetResults.monthlyTrends || [],
      topHotels: facetResults.topHotels || [],
    };
  },
};

module.exports = analyticsService;
