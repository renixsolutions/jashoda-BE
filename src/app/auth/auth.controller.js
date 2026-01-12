const AuthService = require('./auth.service');
const { sendSuccess, sendError } = require('../../utils/response');
const messages = require('../../constants/messages');
const logger = require('../../utils/logger');

class AuthController {
  /**
   * Login user
   */
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
}

module.exports = AuthController;

