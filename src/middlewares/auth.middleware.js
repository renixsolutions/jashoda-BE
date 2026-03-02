const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/response');
const messages = require('../constants/messages');
const appConfig = require('../config/app');
const logger = require('../utils/logger');

/** Error code for 401 when token has no user id (e.g. temp registration token) */
const SESSION_REQUIRED_CODE = 'SESSION_REQUIRED';

/**
 * Verify JWT token
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 401, messages.TOKEN_REQUIRED);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return sendError(res, 401, messages.TOKEN_REQUIRED);
    }

    try {
      const decoded = jwt.verify(token, appConfig.jwt.secret);
      if (decoded.id == null) {
        return res.status(401).json({
          success: false,
          message: messages.SESSION_REQUIRED,
          code: SESSION_REQUIRED_CODE,
          timestamp: new Date().toISOString()
        });
      }
      req.user = decoded;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return sendError(res, 401, messages.TOKEN_EXPIRED);
      }
      return sendError(res, 401, messages.TOKEN_INVALID);
    }
  } catch (error) {
    logger.error('Authentication error:', error);
    return sendError(res, 500, messages.ERROR);
  }
};

/**
 * Optional authentication - doesn't fail if token is missing
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, appConfig.jwt.secret);
        req.user = decoded;
      } catch (error) {
        // Ignore token errors for optional auth
      }
    }
    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  authenticate,
  optionalAuth
};

