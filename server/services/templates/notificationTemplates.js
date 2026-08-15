const formatPrice = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

const getEmailHeader = (title) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 30px auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }
    .header { background-color: #0f172a; color: #ffffff; padding: 28px; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
    .content { padding: 32px; font-size: 14px; line-height: 1.6; color: #334155; }
    .card { background-color: #f8fafc; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0; margin: 20px 0; }
    .badge { display: inline-block; padding: 4px 10px; background-color: #dbeafe; color: #1e40af; border-radius: 6px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
    .footer { background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
    .button { display: inline-block; background-color: #0f172a; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 700; margin-top: 16px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Nestly</h1>
      <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">Luxury Stays & Hospitality</p>
    </div>
    <div class="content">
`;

const getEmailFooter = () => `
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Nestly Hospitality Platform. All rights reserved.</p>
      <p>Thank you for choosing Nestly for your stay accommodations.</p>
    </div>
  </div>
</body>
</html>
`;

const notificationTemplates = {
  BOOKING_CONFIRMED: (data) => ({
    title: 'Booking Confirmed!',
    message: `Your reservation ${data.bookingReference} at ${data.hotelName} is confirmed.`,
    emailSubject: `Your Nestly booking is confirmed — ${data.bookingReference}`,
    emailHtml: `
      ${getEmailHeader('Booking Confirmed')}
        <span class="badge">Confirmed</span>
        <h2 style="color: #0f172a; margin-top: 12px;">Reservation Confirmed</h2>
        <p>Hello <strong>${data.userName}</strong>,</p>
        <p>Your hotel stay at <strong>${data.hotelName}</strong> has been successfully booked!</p>
        
        <div class="card">
          <p style="margin:0 0 8px 0;"><strong>Booking Ref:</strong> <span style="font-family: monospace;">${data.bookingReference}</span></p>
          <p style="margin:0 0 8px 0;"><strong>Property:</strong> ${data.hotelName} (${data.cityName})</p>
          <p style="margin:0 0 8px 0;"><strong>Room:</strong> ${data.roomName}</p>
          <p style="margin:0 0 8px 0;"><strong>Check-in:</strong> ${data.checkIn}</p>
          <p style="margin:0 0 8px 0;"><strong>Check-out:</strong> ${data.checkOut}</p>
          <p style="margin:0;"><strong>Total Amount:</strong> ${formatPrice(data.totalAmount)}</p>
        </div>
      ${getEmailFooter()}
    `,
  }),

  PAYMENT_SUCCESS: (data) => ({
    title: 'Payment Successful',
    message: `Payment of ${formatPrice(data.amount)} received for booking ${data.bookingReference}.`,
    emailSubject: `Payment Receipt — ${data.bookingReference}`,
    emailHtml: `
      ${getEmailHeader('Payment Successful')}
        <span class="badge" style="background:#dcfce7; color:#166534;">Paid</span>
        <h2 style="color: #0f172a; margin-top: 12px;">Payment Receipt</h2>
        <p>Hello <strong>${data.userName}</strong>,</p>
        <p>We have successfully verified your online payment of <strong>${formatPrice(data.amount)}</strong> for booking <strong>${data.bookingReference}</strong>.</p>
        
        <div class="card">
          <p style="margin:0 0 8px 0;"><strong>Transaction ID:</strong> ${data.paymentId || 'Verified'}</p>
          <p style="margin:0 0 8px 0;"><strong>Booking Ref:</strong> ${data.bookingReference}</p>
          <p style="margin:0 0 8px 0;"><strong>Amount Paid:</strong> ${formatPrice(data.amount)}</p>
          <p style="margin:0;"><strong>Payment Method:</strong> Razorpay Gateway</p>
        </div>
      ${getEmailFooter()}
    `,
  }),

  PAYMENT_FAILED: (data) => ({
    title: 'Payment Unsuccessful',
    message: `Your payment attempt for booking ${data.bookingReference} could not be completed.`,
    emailSubject: `Payment Action Required — ${data.bookingReference}`,
    emailHtml: `
      ${getEmailHeader('Payment Failed')}
        <span class="badge" style="background:#ffe4e6; color:#9f1239;">Action Needed</span>
        <h2 style="color: #0f172a; margin-top: 12px;">Payment Could Not Be Processed</h2>
        <p>Hello <strong>${data.userName}</strong>,</p>
        <p>Your payment attempt for booking <strong>${data.bookingReference}</strong> was unsuccessful.</p>
        <p>Don't worry — your room selection is held and you can retry your online payment anytime.</p>
      ${getEmailFooter()}
    `,
  }),

  BOOKING_CANCELLED: (data) => ({
    title: 'Booking Cancelled',
    message: `Your reservation ${data.bookingReference} at ${data.hotelName} has been cancelled.`,
    emailSubject: `Booking Cancellation — ${data.bookingReference}`,
    emailHtml: `
      ${getEmailHeader('Booking Cancelled')}
        <span class="badge" style="background:#fee2e2; color:#991b1b;">Cancelled</span>
        <h2 style="color: #0f172a; margin-top: 12px;">Reservation Cancelled</h2>
        <p>Hello <strong>${data.userName}</strong>,</p>
        <p>Your reservation <strong>${data.bookingReference}</strong> at <strong>${data.hotelName}</strong> has been cancelled.</p>
        <p>Inventory for your dates has been released.</p>
      ${getEmailFooter()}
    `,
  }),

  MANAGER_NEW_BOOKING: (data) => ({
    title: 'New Guest Booking Received',
    message: `New reservation ${data.bookingReference} received for ${data.hotelName} by ${data.customerName}.`,
    emailSubject: `New Reservation Alert — ${data.hotelName}`,
    emailHtml: `
      ${getEmailHeader('New Guest Booking')}
        <span class="badge">Manager Alert</span>
        <h2 style="color: #0f172a; margin-top: 12px;">New Reservation Received</h2>
        <p>Hello Manager,</p>
        <p>A new guest reservation has been confirmed for your property <strong>${data.hotelName}</strong>!</p>
        
        <div class="card">
          <p style="margin:0 0 8px 0;"><strong>Guest:</strong> ${data.customerName} (${data.customerEmail})</p>
          <p style="margin:0 0 8px 0;"><strong>Booking Ref:</strong> ${data.bookingReference}</p>
          <p style="margin:0 0 8px 0;"><strong>Dates:</strong> ${data.checkIn} → ${data.checkOut}</p>
          <p style="margin:0 0 8px 0;"><strong>Room:</strong> ${data.roomName}</p>
          <p style="margin:0;"><strong>Booking Value:</strong> ${formatPrice(data.totalAmount)}</p>
        </div>
      ${getEmailFooter()}
    `,
  }),

  MANAGER_BOOKING_CANCELLED: (data) => ({
    title: 'Guest Cancellation Notice',
    message: `Reservation ${data.bookingReference} for ${data.hotelName} was cancelled by guest.`,
    emailSubject: `Reservation Cancelled — ${data.hotelName}`,
    emailHtml: `
      ${getEmailHeader('Guest Cancellation')}
        <span class="badge" style="background:#fee2e2; color:#991b1b;">Cancelled</span>
        <h2 style="color: #0f172a; margin-top: 12px;">Guest Cancelled Reservation</h2>
        <p>Hello Manager,</p>
        <p>Reservation <strong>${data.bookingReference}</strong> at <strong>${data.hotelName}</strong> was cancelled by the guest. Room inventory has been returned to available status.</p>
      ${getEmailFooter()}
    `,
  }),
};

module.exports = notificationTemplates;
