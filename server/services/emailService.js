const nodemailer = require('nodemailer');

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT || 587;
const smtpUser = process.env.SMTP_USER;
const smtpPassword = process.env.SMTP_PASSWORD;
const emailFrom = process.env.EMAIL_FROM || 'Nestly Stays <noreply@nestly.com>';

let transporter = null;

if (smtpHost && smtpUser && smtpPassword) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: Number(smtpPort),
    secure: Number(smtpPort) === 465,
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
  });
}

const emailService = {
  // Send Email (Non-blocking resilience wrapper)
  sendEmail: async ({ to, subject, html }) => {
    if (!to || !subject || !html) return false;

    try {
      if (transporter) {
        const info = await transporter.sendMail({
          from: emailFrom,
          to,
          subject,
          html,
        });
        console.log(`[Email Service] Email sent successfully to ${to}. MessageId: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
      }

      // Dev Console Sandbox Fallback Mode
      console.log(`[Email Service (Dev Mode)] Mock email dispatched to: ${to} | Subject: "${subject}"`);
      return { success: true, isDevMock: true };
    } catch (error) {
      // Non-blocking resilience: Log error silently to prevent main transaction failure
      console.error(`[Email Service Error] Failed to send email to ${to}:`, error.message);
      return { success: false, error: error.message };
    }
  },
};

module.exports = emailService;
