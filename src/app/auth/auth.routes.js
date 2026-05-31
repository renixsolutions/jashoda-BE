const express = require('express');
const { body } = require('express-validator');
const AuthController = require('./auth.controller');
const { validate } = require('../../middlewares/validate.middleware');
const messages = require('../../constants/messages');
const {
  loginLimiter,
  registerLimiter,
  otpSendLimiter,
  otpVerifyLimiter,
} = require('../../middlewares/rate-limit.middleware');

const router = express.Router();

const loginValidation = [
  body('email').isEmail().withMessage(messages.EMAIL_INVALID).notEmpty().withMessage(messages.EMAIL_REQUIRED),
  body('password').notEmpty().withMessage(messages.PASSWORD_REQUIRED),
  validate
];

const requestOtpValidation = [
  body('email').isEmail().withMessage(messages.EMAIL_INVALID).notEmpty().withMessage(messages.EMAIL_REQUIRED),
  validate
];

const verifyOtpValidation = [
  body('email').isEmail().withMessage(messages.EMAIL_INVALID).notEmpty().withMessage(messages.EMAIL_REQUIRED),
  body('otp').notEmpty().withMessage('OTP is required'),
  validate
];

const completeRegistrationValidation = [
  body('tempToken').notEmpty().withMessage('Token is required'),
  body('fullName').notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage(messages.EMAIL_INVALID).notEmpty().withMessage(messages.EMAIL_REQUIRED),
  body('title').optional().isString(),
  validate
];

const { authenticate } = require('../../middlewares/auth.middleware');

router.post('/login',               loginLimiter,      loginValidation,               AuthController.login);
router.post('/request-otp',         otpSendLimiter,    requestOtpValidation,          AuthController.requestOtp);
router.post('/verify-otp',          otpVerifyLimiter,  verifyOtpValidation,           AuthController.verifyOtp);
router.post('/complete-registration', registerLimiter, completeRegistrationValidation, AuthController.completeRegistration);
router.get('/verify-email',                                                            AuthController.verifyEmail);
router.post('/resend-verification', authenticate,                                     AuthController.resendVerification);

module.exports = router;
