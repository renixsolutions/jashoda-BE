const nodemailer = require('nodemailer');
const appConfig = require('../config/app');
const logger = require('../utils/logger');

const STATIC_OTP = '123456';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const { smtp } = appConfig;
  if (!smtp.user || !smtp.pass) {
    logger.warn('SMTP credentials not set; email sending disabled.');
    return null;
  }
  transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: { user: smtp.user, pass: smtp.pass }
  });
  return transporter;
}

/**
 * Send verification email with link
 * @param {string} to - Recipient email
 * @param {string} name - Recipient name
 * @param {string} verificationToken - Token for verify-email link
 */
async function sendVerificationEmail(to, name, verificationToken) {
  const transport = getTransporter();
  if (!transport) {
    logger.warn('Email not sent (no SMTP): verification link would be ' + verificationToken);
    return;
  }
  const verifyUrl = `${appConfig.appUrl}/api/v1/auth/verify-email?token=${encodeURIComponent(verificationToken)}`;
  const redirectUrl = `${appConfig.frontendUrl}/?email_verified=1`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email - Jashoda Jewelers</title>
</head>
<body style="margin:0; padding:0; font-family: system-ui, -apple-system, sans-serif; background-color: #f5f6f8;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 24px;">
    <tr>
      <td style="background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e8eaef;">
        <h1 style="margin: 0 0 8px; font-size: 22px; color: #2d3748;">Jashoda Jewelers</h1>
        <p style="margin: 0 0 24px; font-size: 14px; color: #6b7280;">Silver jewelry, crafted for you.</p>
        <p style="margin: 0 0 16px; font-size: 16px; color: #1f2937;">Hi ${escapeHtml(name || 'there')},</p>
        <p style="margin: 0 0 24px; font-size: 15px; color: #4b5563; line-height: 1.5;">
          Please verify your email address by clicking the button below. This helps us keep your account secure.
        </p>
        <p style="margin: 0 0 24px;">
          <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background: #2d3748; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 14px; border-radius: 8px;">Verify email</a>
        </p>
        <p style="margin: 0; font-size: 13px; color: #6b7280;">
          Or copy this link: <a href="${verifyUrl}" style="color: #2d3748;">${verifyUrl}</a>
        </p>
        <p style="margin: 24px 0 0; font-size: 12px; color: #9ca3af;">
          If you didn’t create an account with Jashoda Jewelers, you can ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e8eaef; margin: 24px 0;">
        <p style="margin: 0; font-size: 12px; color: #9ca3af;">© ${new Date().getFullYear()} Jashoda Jewelers. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    await transport.sendMail({
      from: `"Jashoda Jewelers" <${appConfig.smtp.from}>`,
      to,
      subject: 'Verify your email - Jashoda Jewelers',
      html
    });
    logger.info('Verification email sent to ' + to);
  } catch (err) {
    logger.error('Failed to send verification email:', err);
    throw new Error('Failed to send verification email');
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = {
  sendVerificationEmail,
  STATIC_OTP
};
