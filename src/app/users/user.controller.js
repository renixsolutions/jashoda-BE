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
   * Get current user (from token)
   */
  static async me(req, res) {
    try {
      const user = await UserService.getUserById(req.user.id);
      return sendSuccess(res, 200, messages.USER_FETCHED, user);
    } catch (error) {
      logger.error('Get me error:', error);
      if (error.message === messages.USER_NOT_FOUND) {
        return sendError(res, 404, error.message);
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

  /**
   * List current user's saved addresses
   */
  static async listMyAddresses(req, res) {
    try {
      const addresses = await UserService.getAddressesForUser(req.user.id);
      return sendSuccess(res, 200, 'Addresses fetched successfully', addresses);
    } catch (error) {
      logger.error('List addresses error:', error);
      return sendError(res, 500, error.message || messages.ERROR);
    }
  }

  /**
   * Create a new address for current user
   */
  static async createMyAddress(req, res) {
    try {
      const address = await UserService.createAddressForUser(req.user.id, req.body);
      return sendSuccess(res, 201, 'Address created successfully', address);
    } catch (error) {
      logger.error('Create address error:', error);
      if (error.message === 'Address is required') {
        return sendError(res, 400, error.message);
      }
      return sendError(res, 500, error.message || messages.ERROR);
    }
  }

  /**
   * Update an address for current user
   */
  static async updateMyAddress(req, res) {
    try {
      const { id } = req.params;
      const address = await UserService.updateAddressForUser(req.user.id, id, req.body);
      return sendSuccess(res, 200, 'Address updated successfully', address);
    } catch (error) {
      logger.error('Update address error:', error);
      if (error.message === 'Address not found') {
        return sendError(res, 404, error.message);
      }
      return sendError(res, 500, error.message || messages.ERROR);
    }
  }

  /**
   * Delete an address for current user
   */
  static async deleteMyAddress(req, res) {
    try {
      const { id } = req.params;
      await UserService.deleteAddressForUser(req.user.id, id);
      return sendSuccess(res, 200, 'Address deleted successfully');
    } catch (error) {
      logger.error('Delete address error:', error);
      if (error.message === 'Address not found') {
        return sendError(res, 404, error.message);
      }
      return sendError(res, 500, error.message || messages.ERROR);
    }
  }

  /**
   * Mark an address as default for current user
   */
  static async setMyDefaultAddress(req, res) {
    try {
      const { id } = req.params;
      const address = await UserService.setDefaultAddressForUser(req.user.id, id);
      return sendSuccess(res, 200, 'Default address updated', address);
    } catch (error) {
      logger.error('Set default address error:', error);
      if (error.message === 'Address not found') {
        return sendError(res, 404, error.message);
      }
      return sendError(res, 500, error.message || messages.ERROR);
    }
  }

  /**
   * List coupons used by a user (Admin only)
   */
  static async getUserCoupons(req, res) {
    try {
      const { id } = req.params;
      const knex = require('../../db/connection').knex;
      const coupons = await knex('user_coupons')
        .join('coupons', 'user_coupons.coupon_id', 'coupons.id')
        .where('user_coupons.user_id', id)
        .select('user_coupons.*', 'coupons.code', 'coupons.title');
      
      return sendSuccess(res, 200, 'User coupons fetched successfully', coupons);
    } catch (error) {
      logger.error('Get user coupons error:', error);
      return sendError(res, 500, error.message || messages.ERROR);
    }
  }

  /**
   * Reset a one-time coupon usage for a user (Admin only)
   */
  static async resetUserCoupon(req, res) {
    try {
      const { id, couponId } = req.params;
      const knex = require('../../db/connection').knex;
      
      await knex('user_coupons')
        .where({ user_id: id, coupon_id: couponId })
        .update({ is_used: false, used_at: null, updated_at: new Date() });
      
      return sendSuccess(res, 200, 'User coupon reset successfully');
    } catch (error) {
      logger.error('Reset user coupon error:', error);
      return sendError(res, 500, error.message || messages.ERROR);
    }
  }
}

module.exports = UserController;

