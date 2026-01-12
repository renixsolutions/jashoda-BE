const UserService = require('./user.service');
const { sendSuccess, sendError } = require('../../utils/response');
const messages = require('../../constants/messages');
const logger = require('../../utils/logger');

class UserController {
  /**
   * Create a new user
   */
  static async create(req, res) {
    try {
      const user = await UserService.createUser(req.body);
      return sendSuccess(res, 201, messages.USER_CREATED, user);
    } catch (error) {
      logger.error('Create user error:', error);
      if (error.message.includes('already exists')) {
        return sendError(res, 409, error.message);
      }
      return sendError(res, 500, error.message || messages.ERROR);
    }
  }

  /**
   * Get user by ID
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const user = await UserService.getUserById(id);
      return sendSuccess(res, 200, messages.USER_FETCHED, user);
    } catch (error) {
      logger.error('Get user error:', error);
      if (error.message === messages.USER_NOT_FOUND) {
        return sendError(res, 404, error.message);
      }
      return sendError(res, 500, error.message || messages.ERROR);
    }
  }

  /**
   * Get all users with pagination
   */
  static async getAll(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        search,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        search,
        sortBy,
        sortOrder
      };

      const result = await UserService.getAllUsers(options);
      return sendSuccess(
        res,
        200,
        messages.USERS_FETCHED,
        result.users,
        { pagination: result.pagination }
      );
    } catch (error) {
      logger.error('Get all users error:', error);
      return sendError(res, 500, error.message || messages.ERROR);
    }
  }

  /**
   * Update user
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const user = await UserService.updateUser(id, req.body);
      return sendSuccess(res, 200, messages.USER_UPDATED, user);
    } catch (error) {
      logger.error('Update user error:', error);
      if (error.message === messages.USER_NOT_FOUND) {
        return sendError(res, 404, error.message);
      }
      if (error.message.includes('already exists')) {
        return sendError(res, 409, error.message);
      }
      return sendError(res, 500, error.message || messages.ERROR);
    }
  }

  /**
   * Delete user
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      await UserService.deleteUser(id);
      return sendSuccess(res, 200, messages.USER_DELETED);
    } catch (error) {
      logger.error('Delete user error:', error);
      if (error.message === messages.USER_NOT_FOUND) {
        return sendError(res, 404, error.message);
      }
      return sendError(res, 500, error.message || messages.ERROR);
    }
  }

  /**
   * Login user
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await UserService.login(email, password);
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

module.exports = UserController;

