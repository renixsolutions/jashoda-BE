const bcrypt = require('bcryptjs');
const UserModel = require('./user.model');
const appConfig = require('../../config/app');
const logger = require('../../utils/logger');
const messages = require('../../constants/messages');
const { generateToken } = require('../../utils/jwt');

class UserService {
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>}
   */
  static async createUser(userData) {
    try {
      const { email, username, password, ...rest } = userData;

      // Check if email already exists
      if (await UserModel.emailExists(email)) {
        throw new Error('Email already exists');
      }

      // Check if username already exists
      if (await UserModel.usernameExists(username)) {
        throw new Error('Username already exists');
      }

      // Hash password with salt from env
      const hashedPassword = await bcrypt.hash(password, appConfig.bcrypt.saltRounds);

      // Create user
      const user = await UserModel.create({
        email,
        username,
        password: hashedPassword,
        ...rest
      });

      // Remove password from response
      delete user.password;

      return user;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   * @param {number} id - User ID
   * @returns {Promise<Object>}
   */
  static async getUserById(id) {
    try {
      const user = await UserModel.findById(id);
      if (!user) {
        throw new Error(messages.USER_NOT_FOUND);
      }
      delete user.password;
      return user;
    } catch (error) {
      logger.error('Error fetching user:', error);
      throw error;
    }
  }

  /**
   * Get all users with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  static async getAllUsers(options) {
    try {
      const result = await UserModel.findAll(options);
      
      // Remove passwords from users
      result.users = result.users.map(user => {
        delete user.password;
        return user;
      });

      return result;
    } catch (error) {
      logger.error('Error fetching users:', error);
      throw error;
    }
  }

  /**
   * Update user
   * @param {number} id - User ID
   * @param {Object} userData - Updated user data
   * @returns {Promise<Object>}
   */
  static async updateUser(id, userData) {
    try {
      const { email, username, password, ...rest } = userData;

      // Check if user exists
      const existingUser = await UserModel.findById(id);
      if (!existingUser) {
        throw new Error(messages.USER_NOT_FOUND);
      }

      // Check if email already exists (excluding current user)
      if (email && await UserModel.emailExists(email, id)) {
        throw new Error('Email already exists');
      }

      // Check if username already exists (excluding current user)
      if (username && await UserModel.usernameExists(username, id)) {
        throw new Error('Username already exists');
      }

      // Hash password if provided with salt from env
      const updateData = { ...rest };
      if (email) updateData.email = email;
      if (username) updateData.username = username;
      if (password) {
        updateData.password = await bcrypt.hash(password, appConfig.bcrypt.saltRounds);
      }

      // Update user
      const user = await UserModel.update(id, updateData);
      if (!user) {
        throw new Error(messages.USER_NOT_FOUND);
      }

      delete user.password;
      return user;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Delete user
   * @param {number} id - User ID
   * @returns {Promise<boolean>}
   */
  static async deleteUser(id) {
    try {
      const user = await UserModel.findById(id);
      if (!user) {
        throw new Error(messages.USER_NOT_FOUND);
      }

      const deleted = await UserModel.delete(id);
      return deleted;
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>}
   */
  static async login(email, password) {
    try {
      const user = await UserModel.findByEmail(email);
      if (!user) {
        throw new Error(messages.INVALID_CREDENTIALS);
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error(messages.INVALID_CREDENTIALS);
      }

      // Check if user is active
      if (user.status !== 'active') {
        throw new Error('Account is not active');
      }

      // Generate JWT token using utility function
      const token = generateToken({
        id: user.id,
        email: user.email,
        username: user.username
      });

      // Remove password from user object
      delete user.password;

      return {
        user,
        token
      };
    } catch (error) {
      logger.error('Error logging in user:', error);
      throw error;
    }
  }
}

module.exports = UserService;

