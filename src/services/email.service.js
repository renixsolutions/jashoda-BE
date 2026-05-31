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

/**
 * Send admin 2FA OTP code
 * @param {string} to - Admin email
 * @param {string} otp - 6-digit OTP
 */
async function sendAdminTwoFaCode(to, otp) {
  const transport = getTransporter();
  if (!transport) {
    logger.warn(`[DEV] Admin 2FA OTP for ${to}: ${otp}`);
    return;
  }
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Admin Verification Code</title></head>
<body style="margin:0;padding:0;font-family:system-ui,-apple-system,sans-serif;background:#f5f6f8;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;padding:24px;">
    <tr><td style="background:#fff;border-radius:12px;padding:36px;border:1px solid #e8eaef;">
      <div style="margin-bottom:24px;">
        <h1 style="margin:0 0 4px;font-size:20px;color:#1a202c;font-weight:700;">Jashoda Admin</h1>
        <p style="margin:0;font-size:13px;color:#6b7280;">Security verification</p>
      </div>
      <p style="margin:0 0 16px;font-size:15px;color:#374151;">Your verification code is:</p>
      <div style="background:#1a202c;border-radius:10px;padding:20px 32px;text-align:center;margin:0 0 24px;">
        <span style="font-size:38px;font-weight:700;letter-spacing:12px;color:#fff;font-family:monospace;">${otp}</span>
      </div>
      <p style="margin:0 0 8px;font-size:14px;color:#6b7280;">This code expires in <strong>10 minutes</strong>.</p>
      <p style="margin:0;font-size:13px;color:#9ca3af;">If you did not attempt to log in, your account may be at risk. Change your password immediately.</p>
      <hr style="border:none;border-top:1px solid #e8eaef;margin:24px 0;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">&copy; ${new Date().getFullYear()} Jashoda Jewelers. All rights reserved.</p>
    </td></tr>
  </table>
</body>
</html>`;

  await transport.sendMail({
    from: `"Jashoda Admin Security" <${appConfig.smtp.from}>`,
    to,
    subject: `Your admin verification code: ${otp}`,
    html,
  });
  logger.info(`Admin 2FA code sent to ${to}`);
}

/**
 * Send admin password reset email
 * @param {string} to - Admin email
 * @param {string} name - Admin name
 * @param {string} resetUrl - Full reset URL with token
 */
async function sendAdminPasswordResetEmail(to, name, resetUrl) {
  const transport = getTransporter();
  if (!transport) {
    logger.warn(`[DEV] Admin password reset link for ${to}: ${resetUrl}`);
    return;
  }
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Reset Your Password</title></head>
<body style="margin:0;padding:0;font-family:system-ui,-apple-system,sans-serif;background:#f5f6f8;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;padding:24px;">
    <tr><td style="background:#fff;border-radius:12px;padding:36px;border:1px solid #e8eaef;">
      <div style="margin-bottom:24px;">
        <h1 style="margin:0 0 4px;font-size:20px;color:#1a202c;font-weight:700;">Jashoda Admin</h1>
        <p style="margin:0;font-size:13px;color:#6b7280;">Password reset request</p>
      </div>
      <p style="margin:0 0 16px;font-size:15px;color:#374151;">Hi ${escapeHtml(name || 'Admin')},</p>
      <p style="margin:0 0 24px;font-size:15px;color:#4b5563;line-height:1.6;">
        We received a request to reset your admin account password. Click the button below to set a new password.
      </p>
      <p style="margin:0 0 24px;text-align:center;">
        <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;background:#1a202c;color:#fff;text-decoration:none;font-weight:600;font-size:15px;border-radius:8px;">Reset Password</a>
      </p>
      <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">This link expires in <strong>1 hour</strong>.</p>
      <p style="margin:0 0 24px;font-size:13px;color:#9ca3af;">If you did not request this, you can safely ignore this email. Your password will not change.</p>
      <p style="margin:0;font-size:12px;color:#9ca3af;">Or copy: <a href="${resetUrl}" style="color:#4b5563;">${resetUrl}</a></p>
      <hr style="border:none;border-top:1px solid #e8eaef;margin:24px 0;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">&copy; ${new Date().getFullYear()} Jashoda Jewelers. All rights reserved.</p>
    </td></tr>
  </table>
</body>
</html>`;

  await transport.sendMail({
    from: `"Jashoda Admin Security" <${appConfig.smtp.from}>`,
    to,
    subject: 'Reset your admin password — Jashoda',
    html,
  });
  logger.info(`Admin password reset email sent to ${to}`);
}

/**
 * Send OTP code for login
 * @param {string} to - User email
 * @param {string} otp - 6-digit OTP
 */
async function sendOtpEmail(to, otp) {
  const transport = getTransporter();
  if (!transport) {
    logger.warn(`[DEV] OTP for ${to}: ${otp}`);
    return;
  }
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your Login Code</title></head>
<body style="margin:0;padding:0;font-family:system-ui,-apple-system,sans-serif;background:#f5f6f8;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;padding:24px;">
    <tr><td style="background:#fff;border-radius:12px;padding:36px;border:1px solid #e8eaef;">
      <div style="margin-bottom:24px;">
        <h1 style="margin:0 0 4px;font-size:20px;color:#1a202c;font-weight:700;">Jashoda Jewelers</h1>
        <p style="margin:0;font-size:13px;color:#6b7280;">Login Verification</p>
      </div>
      <p style="margin:0 0 16px;font-size:15px;color:#374151;">Your verification code is:</p>
      <div style="background:#1a202c;border-radius:10px;padding:20px 32px;text-align:center;margin:0 0 24px;">
        <span style="font-size:38px;font-weight:700;letter-spacing:12px;color:#fff;font-family:monospace;">${otp}</span>
      </div>
      <p style="margin:0 0 8px;font-size:14px;color:#6b7280;">This code expires in <strong>10 minutes</strong>.</p>
      <hr style="border:none;border-top:1px solid #e8eaef;margin:24px 0;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">&copy; ${new Date().getFullYear()} Jashoda Jewelers. All rights reserved.</p>
    </td></tr>
  </table>
</body>
</html>`;

  await transport.sendMail({
    from: `"Jashoda Jewelers" <${appConfig.smtp.from}>`,
    to,
    subject: `Your login code: ${otp}`,
    html,
  });
  logger.info(`OTP code sent to ${to}`);
}

/**
 * Send order confirmation email with bill/invoice
 * @param {Object} order - Full order object including items and user details
 */
async function sendOrderConfirmationEmail(order) {
  const transport = getTransporter();
  const to = order.user?.email || order.shipping_address?.email;
  if (!transport || !to) {
    logger.warn(`[DEV] Order confirmation for order ${order.order_number} to ${to}`);
    return;
  }

  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #e8eaef;">
        <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1a202c;">${escapeHtml(item.product_name)}</p>
        ${item.size_label ? `<p style="margin: 4px 0 0; font-size: 12px; color: #6b7280;">Size: ${escapeHtml(item.size_label)}</p>` : ''}
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #e8eaef; text-align: center; color: #4b5563; font-size: 14px;">
        ${item.quantity}
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #e8eaef; text-align: right; color: #1a202c; font-size: 14px;">
        ₹${item.price}
      </td>
    </tr>
  `).join('');

  const address = order.shipping_address || {};
  const dateStr = new Date(order.created_at || Date.now()).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Order Confirmation - Jashoda Jewelers</title></head>
<body style="margin:0;padding:0;font-family:system-ui,-apple-system,sans-serif;background:#f5f6f8;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:24px;">
    <tr><td style="background:#fff;border-radius:12px;padding:36px;border:1px solid #e8eaef;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="margin:0 0 8px;font-size:24px;color:#702540;font-weight:700;font-family:serif;letter-spacing:1px;">Jashoda Jewellers</h1>
        <p style="margin:0;font-size:14px;color:#6b7280;">Order Confirmation & Invoice</p>
      </div>
      
      <p style="margin:0 0 16px;font-size:15px;color:#374151;">Hi ${escapeHtml(order.user?.name || address.name || 'there')},</p>
      <p style="margin:0 0 24px;font-size:15px;color:#4b5563;line-height:1.6;">
        Thank you for your order! We've received your order and are getting it ready. Below is your bill and order summary.
      </p>

      <div style="background:#f9fafb; border-radius:8px; padding:20px; margin-bottom: 32px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding-bottom: 12px;">
              <p style="margin:0; font-size:12px; color:#6b7280; text-transform:uppercase; letter-spacing:0.5px;">Order Number</p>
              <p style="margin:4px 0 0; font-size:15px; font-weight:600; color:#1a202c;">${order.order_number}</p>
            </td>
            <td style="padding-bottom: 12px; text-align:right;">
              <p style="margin:0; font-size:12px; color:#6b7280; text-transform:uppercase; letter-spacing:0.5px;">Order Date</p>
              <p style="margin:4px 0 0; font-size:15px; font-weight:600; color:#1a202c;">${dateStr}</p>
            </td>
          </tr>
          <tr>
            <td style="padding-top: 12px; border-top: 1px solid #e5e7eb;" colspan="2">
              <p style="margin:0; font-size:12px; color:#6b7280; text-transform:uppercase; letter-spacing:0.5px;">Shipping Address</p>
              <p style="margin:4px 0 0; font-size:14px; color:#374151; line-height:1.5;">
                ${escapeHtml(address.name)}<br>
                ${escapeHtml(address.address)}<br>
                ${escapeHtml(address.city)}, ${escapeHtml(address.state)} ${escapeHtml(address.pincode)}<br>
                Ph: ${escapeHtml(address.phone)}
              </p>
            </td>
          </tr>
        </table>
      </div>

      <h2 style="margin:0 0 16px; font-size:16px; color:#1a202c;">Order Summary</h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
        <thead>
          <tr>
            <th style="padding: 0 0 12px; text-align: left; border-bottom: 2px solid #e8eaef; font-size: 13px; color: #6b7280; text-transform: uppercase;">Item</th>
            <th style="padding: 0 0 12px; text-align: center; border-bottom: 2px solid #e8eaef; font-size: 13px; color: #6b7280; text-transform: uppercase;">Qty</th>
            <th style="padding: 0 0 12px; text-align: right; border-bottom: 2px solid #e8eaef; font-size: 13px; color: #6b7280; text-transform: uppercase;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
        <tr>
          <td style="padding: 4px 0; font-size: 14px; color: #4b5563;">Subtotal</td>
          <td style="padding: 4px 0; text-align: right; font-size: 14px; color: #1a202c;">₹${order.subtotal}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; font-size: 14px; color: #4b5563;">Tax (GST)</td>
          <td style="padding: 4px 0; text-align: right; font-size: 14px; color: #1a202c;">₹${order.tax}</td>
        </tr>
        ${order.discount > 0 ? `
        <tr>
          <td style="padding: 4px 0; font-size: 14px; color: #059669;">Discount</td>
          <td style="padding: 4px 0; text-align: right; font-size: 14px; color: #059669;">-₹${order.discount}</td>
        </tr>` : ''}
        <tr>
          <td style="padding: 12px 0 0; font-size: 16px; font-weight: 700; color: #1a202c; border-top: 2px solid #e8eaef;">Total</td>
          <td style="padding: 12px 0 0; text-align: right; font-size: 18px; font-weight: 700; color: #702540; border-top: 2px solid #e8eaef;">₹${order.total}</td>
        </tr>
      </table>

      <p style="margin:0 0 8px;font-size:14px;color:#6b7280;text-align:center;">
        Payment Method: <strong>${order.payment_method === 'cod' ? 'Cash on Delivery' : 'Paid Online (Razorpay)'}</strong>
      </p>

      <hr style="border:none;border-top:1px solid #e8eaef;margin:32px 0 24px;">
      <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
        If you have any questions, reply to this email or contact our support.<br>
        &copy; ${new Date().getFullYear()} Jashoda Jewellers. All rights reserved.
      </p>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    await transport.sendMail({
      from: `"Jashoda Jewellers" <${appConfig.smtp.from}>`,
      to,
      subject: `Order Confirmation - ${order.order_number}`,
      html,
    });
    logger.info(`Order confirmation email sent to ${to} for order ${order.order_number}`);
  } catch (err) {
    logger.error('Failed to send order confirmation email:', err);
  }
}

/**
 * Helper to generate the HTML for admin order alerts
 */
function getAdminOrderAlertHtml(order, title, alertColor) {
  const address = order.shipping_address || {};
  const dateStr = new Date(order.created_at || Date.now()).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #e8eaef; font-size: 13px; color: #1a202c;">${escapeHtml(item.product_name)}</td>
      <td style="padding: 12px 0; border-bottom: 1px solid #e8eaef; font-size: 13px; text-align: center; color: #4b5563;">${item.quantity}</td>
      <td style="padding: 12px 0; border-bottom: 1px solid #e8eaef; font-size: 13px; text-align: right; color: #1a202c;">₹${item.price}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Admin Alert</title></head>
<body style="margin:0;padding:0;font-family:system-ui,-apple-system,sans-serif;background:#f5f6f8;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:20px auto;padding:24px;">
    <tr><td style="background:#fff;border-radius:12px;border-top:6px solid ${alertColor};padding:32px;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
      <h2 style="margin:0 0 16px;font-size:20px;color:${alertColor};">${title}</h2>
      
      <div style="background:#f9fafb; border-radius:8px; padding:16px; margin-bottom: 24px;">
        <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>Order ID:</strong> ${order.order_number}</p>
        <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>Time:</strong> ${dateStr}</p>
        <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>Payment Method:</strong> ${order.payment_method === 'cod' ? 'COD' : 'Razorpay'}</p>
        <p style="margin:0;font-size:14px;color:#374151;"><strong>Total Amount:</strong> ₹${order.total}</p>
      </div>

      <h3 style="margin:0 0 12px;font-size:16px;color:#1a202c;">Customer Details</h3>
      <p style="margin:0 0 24px;font-size:14px;color:#4b5563;line-height:1.5;">
        <strong>Name:</strong> ${escapeHtml(order.user?.name || address.name)}<br>
        <strong>Email:</strong> ${escapeHtml(order.user?.email || address.email)}<br>
        <strong>Phone:</strong> ${escapeHtml(address.phone)}<br>
        <strong>Location:</strong> ${escapeHtml(address.city)}, ${escapeHtml(address.state)} ${escapeHtml(address.pincode)}
      </p>

      <h3 style="margin:0 0 12px;font-size:16px;color:#1a202c;">Items</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        ${itemsHtml}
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Send alert to Admin on successful order placement
 */
async function sendAdminOrderSuccessEmail(order) {
  const transport = getTransporter();
  if (!transport || !appConfig.smtp.from) return;
  
  const html = getAdminOrderAlertHtml(order, '🎉 New Order Received!', '#059669'); // Green

  try {
    await transport.sendMail({
      from: `"Jashoda System" <${appConfig.smtp.from}>`,
      to: appConfig.smtp.from, // Send to self (admin)
      subject: `[New Order] ₹${order.total} - ${order.order_number}`,
      html,
    });
  } catch (err) {
    logger.error('Failed to send admin order success email:', err);
  }
}

/**
 * Send alert to Admin on failed/abandoned transaction
 */
async function sendAdminPaymentFailedEmail(order, reason = "Payment failed or abandoned") {
  const transport = getTransporter();
  if (!transport || !appConfig.smtp.from) return;
  
  const html = getAdminOrderAlertHtml(order, `⚠️ Transaction Failed: ${reason}`, '#dc2626'); // Red

  try {
    await transport.sendMail({
      from: `"Jashoda System" <${appConfig.smtp.from}>`,
      to: appConfig.smtp.from, // Send to self (admin)
      subject: `[Payment Failed] ₹${order.total} - ${order.order_number}`,
      html,
    });
  } catch (err) {
    logger.error('Failed to send admin payment failure email:', err);
  }
}

module.exports = {
  sendVerificationEmail,
  sendAdminTwoFaCode,
  sendAdminPasswordResetEmail,
  sendOtpEmail,
  sendOrderConfirmationEmail,
  sendAdminOrderSuccessEmail,
  sendAdminPaymentFailedEmail,
  STATIC_OTP
};
