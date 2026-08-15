const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const razorpayProvider = require('./providers/razorpayProvider');

const paymentService = {
  // Create Payment Order for Booking (Server-Side Amount Authority)
  createPaymentOrderForBooking: async (bookingId, userId) => {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      const err = new Error('Booking record not found');
      err.statusCode = 404;
      throw err;
    }

    // Ownership check
    if (booking.user.toString() !== userId.toString()) {
      const err = new Error('Forbidden: You do not have permission to pay for this booking');
      err.statusCode = 403;
      throw err;
    }

    // State checks
    if (booking.paymentStatus === 'paid') {
      const err = new Error('This reservation has already been paid');
      err.statusCode = 400;
      throw err;
    }

    if (booking.status === 'cancelled') {
      const err = new Error('Cannot process payment for a cancelled reservation');
      err.statusCode = 400;
      throw err;
    }

    // Server-Side Amount Authority: Convert booking totalAmount to subunits (paise)
    const amountInSubunits = Math.round(booking.totalAmount * 100);

    // Call Provider to create Order
    const gatewayOrder = await razorpayProvider.createOrder(amountInSubunits, booking.bookingReference);

    // Upsert Payment Record
    const payment = await Payment.findOneAndUpdate(
      { booking: booking._id, status: { $ne: 'paid' } },
      {
        booking: booking._id,
        user: booking.user,
        provider: 'razorpay',
        providerOrderId: gatewayOrder.id,
        amount: booking.totalAmount,
        amountInSubunits,
        currency: booking.currency || 'INR',
        status: 'created',
      },
      { upsert: true, new: true }
    );

    return {
      orderId: gatewayOrder.id,
      amountInSubunits,
      amount: booking.totalAmount,
      currency: booking.currency || 'INR',
      keyId: razorpayProvider.getKeyId(),
      bookingId: booking._id,
      bookingReference: booking.bookingReference,
      paymentId: payment._id,
    };
  },

  // Verify HMAC Signature & Complete Payment (Idempotent)
  verifyAndProcessPayment: async (bookingId, userId, razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      const err = new Error('Booking record not found');
      err.statusCode = 404;
      throw err;
    }

    // Ownership check
    if (booking.user.toString() !== userId.toString()) {
      const err = new Error('Forbidden: You are not authorized to verify payment for this booking');
      err.statusCode = 403;
      throw err;
    }

    // Idempotency Check: Already paid
    if (booking.paymentStatus === 'paid') {
      const existingPayment = await Payment.findOne({ booking: booking._id, status: 'paid' });
      return {
        success: true,
        message: 'Payment has already been processed and verified',
        payment: existingPayment,
        booking,
      };
    }

    let payment = await Payment.findOne({ providerOrderId: razorpayOrderId }) || await Payment.findOne({ booking: booking._id });
    if (!payment) {
      payment = await Payment.create({
        booking: booking._id,
        user: booking.user,
        provider: 'razorpay',
        providerOrderId: razorpayOrderId,
        amount: booking.totalAmount,
        amountInSubunits: Math.round(booking.totalAmount * 100),
        currency: booking.currency || 'INR',
        status: 'pending',
      });
    }

    // Verify HMAC-SHA256 Signature
    const isValidSignature = razorpayProvider.verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);

    if (!isValidSignature) {
      payment.status = 'failed';
      payment.failureReason = 'HMAC Signature verification failed';
      await payment.save();

      const err = new Error('Invalid payment signature verification failed');
      err.statusCode = 400;
      throw err;
    }

    // Update Payment State
    payment.status = 'paid';
    payment.providerPaymentId = razorpayPaymentId;
    payment.providerSignature = razorpaySignature;
    payment.paidAt = new Date();
    await payment.save();

    // Update Booking State
    booking.paymentStatus = 'paid';
    booking.status = 'confirmed';
    await booking.save();

    return {
      success: true,
      message: 'Payment verified and reservation confirmed!',
      payment,
      booking,
    };
  },

  // Webhook Processor (Idempotent Event Processing)
  processWebhookEvent: async (eventPayload) => {
    const event = eventPayload.event;
    const payload = eventPayload.payload;

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload.payment?.entity || payload.order?.entity;
      const orderId = paymentEntity.order_id || paymentEntity.id;
      const paymentId = paymentEntity.id;

      const payment = await Payment.findOne({ providerOrderId: orderId });
      if (payment && payment.status !== 'paid') {
        payment.status = 'paid';
        payment.providerPaymentId = paymentId;
        payment.paidAt = new Date();
        await payment.save();

        await Booking.findByIdAndUpdate(payment.booking, {
          paymentStatus: 'paid',
          status: 'confirmed',
        });
      }
    } else if (event === 'payment.failed') {
      const paymentEntity = payload.payment?.entity;
      const orderId = paymentEntity?.order_id;

      if (orderId) {
        await Payment.findOneAndUpdate(
          { providerOrderId: orderId },
          { status: 'failed', failureReason: paymentEntity?.error_description || 'Payment failed' }
        );
      }
    }

    return { processed: true, event };
  },
};

module.exports = paymentService;
