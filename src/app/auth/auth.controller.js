const AuthService = require('./auth.service');
const { sendSuccess, sendError } = require('../../utils/response');
const messages = require('../../constants/messages');
const logger = require('../../utils/logger');
const appConfig = require('../../config/app');

class AuthController {
  static async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      return sendSuccess(res, 200, messages.USER_LOGIN_SUCCESS, result);
    } catch (error) {
      logger.error('Login error:', error);
      if (error.message === messages.INVALID_CREDENTIALS || error.message.includes('not active')) {
        return sendError(res, 401, error.message);
      }
      return sendError(res, 500, error.message || messages.ERROR);
    }
  }

  static async requestOtp(req, res) {
    try {
      const { phone } = req.body;
      await AuthService.requestOtp(phone);
      return sendSuccess(res, 200, 'OTP sent successfully');
    } catch (error) {
      logger.error('Request OTP error:', error);
      return sendError(res, 400, error.message || 'Invalid phone number');
    }
  }

  static async verifyOtp(req, res) {
    try {
      const { phone, otp } = req.body;
      const result = await AuthService.verifyOtp(phone, otp);
      return sendSuccess(res, 200, 'OTP verified', result);
    } catch (error) {
      logger.error('Verify OTP error:', error);
      if (error.message === 'Invalid OTP' || error.message === 'Invalid phone number') {
        return sendError(res, 400, error.message);
      }
      if (error.message.includes('not active')) {
        return sendError(res, 401, error.message);
      }
      return sendError(res, 500, error.message || messages.ERROR);
    }
  }

  static async completeRegistration(req, res) {
    try {
      const { tempToken, title, fullName, email } = req.body;
      const result = await AuthService.completeRegistration(tempToken, { title, fullName, email });
      return sendSuccess(res, 201, 'Registration complete. Verification email sent.', result);
    } catch (error) {
      logger.error('Complete registration error:', error);
      if (error.message.includes('Invalid') || error.message.includes('required') || error.message.includes('already')) {
        return sendError(res, 400, error.message);
      }
      return sendError(res, 500, error.message || messages.ERROR);
    }
  }

  static async verifyEmail(req, res) {
    try {
      const { token } = req.query;
      if (!token) {
        return res.redirect(`${appConfig.frontendUrl}/?email_verified=0&error=missing_token`);
      }
      await AuthService.verifyEmail(token);
      return res.redirect(`${appConfig.frontendUrl}/?email_verified=1`);
    } catch (error) {
      logger.error('Verify email error:', error);
      const isConnectionError = error.message && (
        error.message.includes('Connection terminated') ||
        error.message.includes('ECONNRESET') ||
        error.message.includes('connection')
      );
      const errorCode = isConnectionError ? 'connection_error' : 'invalid_or_expired';
      return res.redirect(`${appConfig.frontendUrl}/?email_verified=0&error=${errorCode}`);
    }
  }
}

module.exports = AuthController;
