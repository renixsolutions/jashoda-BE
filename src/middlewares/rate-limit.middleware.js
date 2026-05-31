const rateLimit = require('express-rate-limit');

/**
 * Shared rate limit response handler — returns a clean JSON 429 response.
 */
const rateLimitHandler = (req, res, /*next*/ _, options) => {
  res.status(options.statusCode).json({
    success: false,
    statusCode: options.statusCode,
    message: options.message,
    retryAfter: Math.ceil(options.windowMs / 1000 / 60) + ' minutes',
  });
};

// ─────────────────────────────────────────────
// AUTH — granular per-endpoint limits
// ─────────────────────────────────────────────

/** POST /api/v1/auth/login — 5 attempts per 15 min */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many login attempts. Please try again after 15 minutes.',
  handler: rateLimitHandler,
});

/** POST /api/v1/auth/complete-registration — 5 per 15 min */
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many registration attempts. Please try again after 15 minutes.',
  handler: rateLimitHandler,
});

/** POST /api/v1/auth/request-otp — 3 OTP send per 15 min */
const otpSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many OTP requests. Please try again after 15 minutes.',
  handler: rateLimitHandler,
});

/** POST /api/v1/auth/verify-otp — 10 verify attempts per 15 min */
const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many OTP verification attempts. Please try again after 15 minutes.',
  handler: rateLimitHandler,
});

// ─────────────────────────────────────────────
// UPLOAD — 100 uploads per 15 min
// ─────────────────────────────────────────────

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Upload limit reached. Please try again after 15 minutes.',
  handler: rateLimitHandler,
});

// ─────────────────────────────────────────────
// ADMIN API — 500 requests per 15 min
// ─────────────────────────────────────────────

const adminApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Admin API rate limit exceeded. Please try again after 15 minutes.',
  handler: rateLimitHandler,
});

// ─────────────────────────────────────────────
// PUBLIC API — 1000 requests per 15 min
// ─────────────────────────────────────────────

const publicApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests. Please slow down and try again after 15 minutes.',
  handler: rateLimitHandler,
});

// ─────────────────────────────────────────────
// GLOBAL SAFETY NET — 2000 requests per 15 min
// ─────────────────────────────────────────────

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Global request limit exceeded. Please try again after 15 minutes.',
  handler: rateLimitHandler,
});

// ─────────────────────────────────────────────
// ADMIN AUTH — dedicated per-endpoint limits
// ─────────────────────────────────────────────

/** POST /api/v1/admin/auth/forgot-password — 3 per 15 min */
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many password reset requests. Please try again after 15 minutes.',
  handler: rateLimitHandler,
});

/** POST /api/v1/admin/auth/verify-2fa — 5 per 10 min */
const verify2FALimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many verification attempts. Please log in again after 10 minutes.',
  handler: rateLimitHandler,
});

/** POST /api/v1/admin/auth/reset-password — 5 per 15 min */
const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many password reset attempts. Please try again after 15 minutes.',
  handler: rateLimitHandler,
});

module.exports = {
  loginLimiter,
  registerLimiter,
  otpSendLimiter,
  otpVerifyLimiter,
  uploadLimiter,
  adminApiLimiter,
  publicApiLimiter,
  globalLimiter,
  forgotPasswordLimiter,
  verify2FALimiter,
  resetPasswordLimiter,
};
