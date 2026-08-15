const Notification = require('../models/Notification');
const User = require('../models/User');
const emailService = require('./emailService');
const notificationTemplates = require('./templates/notificationTemplates');

const notificationService = {
  // Dispatch Notification Event
  dispatchNotificationEvent: async (type, payload) => {
    try {
      const templateFormatter = notificationTemplates[type];
      if (!templateFormatter) {
        console.warn(`[Notification Service] Unsupported notification event type: ${type}`);
        return null;
      }

      const formatted = templateFormatter(payload);
      const recipientId = payload.recipientId || payload.userId;

      if (!recipientId) {
        console.warn(`[Notification Service] Missing recipient user ID for event: ${type}`);
        return null;
      }

      const recipient = await User.findById(recipientId);
      if (!recipient || !recipient.isActive) {
        return null;
      }

      // Deduplication Guard: Prevent duplicate notifications for same booking event within 60s
      if (payload.bookingId) {
        const recentDuplicate = await Notification.findOne({
          user: recipient._id,
          type,
          'data.bookingId': payload.bookingId,
          createdAt: { $gte: new Date(Date.now() - 60000) },
        });

        if (recentDuplicate) {
          console.log(`[Notification Service] Suppressed duplicate notification for booking ${payload.bookingId} (${type})`);
          return recentDuplicate;
        }
      }

      const prefs = recipient.notificationPreferences || {};
      let inAppCreated = null;

      // 1. In-App Notification
      const allowInApp = prefs.inAppBookingUpdates !== false;
      if (allowInApp) {
        inAppCreated = await Notification.create({
          user: recipient._id,
          type,
          title: formatted.title,
          message: formatted.message,
          channel: 'in_app',
          data: {
            bookingId: payload.bookingId,
            bookingReference: payload.bookingReference,
            hotelId: payload.hotelId,
          },
        });
      }

      // 2. Email Notification
      const allowEmail = type.includes('PAYMENT') ? prefs.emailPaymentUpdates !== false :
                         type.includes('CANCELLED') ? prefs.emailCancellationUpdates !== false :
                         type.includes('MANAGER') ? prefs.emailManagerBookingUpdates !== false :
                         prefs.emailBookingConfirmation !== false;

      if (allowEmail && recipient.email) {
        emailService.sendEmail({
          to: recipient.email,
          subject: formatted.emailSubject,
          html: formatted.emailHtml,
        }).catch(err => console.error('[Notification Email Async Error]', err));
      }

      return inAppCreated;
    } catch (error) {
      // Non-blocking resilience: Catch errors so core booking/payment flow is never interrupted
      console.error('[Notification Service Error]', error.message);
      return null;
    }
  },
};

module.exports = notificationService;
