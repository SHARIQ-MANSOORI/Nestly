const Payment = require('../models/Payment');
const Hotel = require('../models/Hotel');
const Booking = require('../models/Booking');
const paymentService = require('../services/paymentService');
const razorpayProvider = require('../services/providers/razorpayProvider');

// @desc    Create Razorpay Order for Booking (Server-Side Amount Authority)
// @route   POST /api/payments/create-order
// @access  Private (Customer)
const createPaymentOrder = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide booking ID',
      });
    }

    const orderDetails = await paymentService.createPaymentOrderForBooking(bookingId, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Payment order created successfully',
      data: orderDetails,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Razorpay HMAC Signature & Complete Payment
// @route   POST /api/payments/verify
// @access  Private (Customer)
const verifyPayment = async (req, res, next) => {
  try {
    const {
      bookingId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

    if (!bookingId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: 'Please provide booking ID, order ID, payment ID, and signature',
      });
    }

    const result = await paymentService.verifyAndProcessPayment(
      bookingId,
      req.user._id,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Razorpay Webhook Handler
// @route   POST /api/payments/webhook
// @access  Public (Signature Verified)
const handleWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.rawBody || JSON.stringify(req.body);

    const isValidWebhook = razorpayProvider.verifyWebhookSignature(rawBody, signature);
    if (!isValidWebhook) {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook signature',
      });
    }

    const result = await paymentService.processWebhookEvent(req.body);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get customer payment history
// @route   GET /api/payments/my
// @access  Private (Customer)
const getMyPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .populate('booking', 'bookingReference totalAmount checkIn checkOut status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment receipt details
// @route   GET /api/payments/:id
// @access  Private (Customer / Admin)
const getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('user', 'name email')
      .populate('booking');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found',
      });
    }

    const isCustomer = payment.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to view this payment',
      });
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment visibility for manager's properties
// @route   GET /api/manager/payments
// @access  Private (Manager / Admin)
const getManagerPayments = async (req, res, next) => {
  try {
    const managerHotels = await Hotel.find({ owner: req.user._id }).select('_id');
    const hotelIds = managerHotels.map(h => h._id);

    const bookings = await Booking.find({ hotel: { $in: hotelIds } }).select('_id');
    const bookingIds = bookings.map(b => b._id);

    const payments = await Payment.find({ booking: { $in: bookingIds } })
      .populate('user', 'name email')
      .populate('booking', 'bookingReference hotel room totalAmount status paymentStatus')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  handleWebhook,
  getMyPayments,
  getPaymentById,
  getManagerPayments,
};
