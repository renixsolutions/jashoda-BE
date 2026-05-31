const express = require('express');
const { body } = require('express-validator');
const AdminAuthService = require('./admin.auth.service');
const { validate } = require('../../middlewares/validate.middleware');
const { sendSuccess, sendError } = require('../../utils/response');
const logger = require('../../utils/logger');
const {
  forgotPasswordLimiter,
  verify2FALimiter,
  resetPasswordLimiter,
} = require('../../middlewares/rate-limit.middleware');

const router = express.Router();

// ── POST /api/v1/admin/auth/verify-2fa ─────────────────────────────────
router.post(
  '/verify-2fa',
  verify2FALimiter,
  [
    body('challengeToken').notEmpty().withMessage('Challenge token is required'),
    body('otp').notEmpty().isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
    validate,
  ],
  async (req, res) => {
    try {
      const { challengeToken, otp } = req.body;
      const result = await AdminAuthService.verify2FA(challengeToken, otp);
      return sendSuccess(res, 200, 'Login successful', result);
    } catch (err) {
      logger.error('Admin 2FA verify error:', err);
      return sendError(res, 400, err.message || 'Verification failed');
    }
  }
);

// ── POST /api/v1/admin/auth/forgot-password ────────────────────────────
router.post(
  '/forgot-password',
  forgotPasswordLimiter,
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    validate,
  ],
  async (req, res) => {
    try {
      const result = await AdminAuthService.forgotPassword(req.body.email);
      // Always 200 — never reveal whether email exists
      return sendSuccess(res, 200, result.message);
    } catch (err) {
      logger.error('Admin forgot password error:', err);
      // Return generic 200 even on unexpected errors
      return sendSuccess(res, 200, 'If the account exists, a reset link has been sent.');
    }
  }
);

// ── POST /api/v1/admin/auth/reset-password ─────────────────────────────
router.post(
  '/reset-password',
  resetPasswordLimiter,
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    validate,
  ],
  async (req, res) => {
    try {
      const { token, password } = req.body;
      const result = await AdminAuthService.resetPassword(token, password);
      return sendSuccess(res, 200, result.message);
    } catch (err) {
      logger.error('Admin reset password error:', err);
      return sendError(res, 400, err.message || 'Password reset failed');
    }
  }
);

module.exports = router;
