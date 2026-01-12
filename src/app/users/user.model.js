const knex = require('../../db/knex');
const { sanitizeObject } = require('../../utils/helpers');

class UserModel {
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>}
   */
  static async create(userData) {
    const sanitized = sanitizeObject(userData);
    const [user] = await knex('users')
      .insert(sanitized)
      .returning('*');
    return user;
  }

  /**
   * Find user by ID
   * @param {number} id - User ID
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    const user = await knex('users')
      .where({ id })
      .whereNull('deleted_at')
      .first();
    return user;
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>}
   */
  static async findByEmail(email) {
    const user = await knex('users')
      .where({ email })
      .whereNull('deleted_at')
      .first();
    return user;
  }

  /**
   * Find user by username
   * @param {string} username - Username
   * @returns {Promise<Object|null>}
   */
  static async findByUsername(username) {
    const user = await knex('users')
      .where({ username })
      .whereNull('deleted_at')
      .first();
    return user;
  }

  /**
   * Find all users with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  static async findAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = options;

    const offset = (page - 1) * limit;

    let query = knex('users').whereNull('deleted_at');

    // Filter by status
    if (status) {
      query = query.where({ status });
    }

    // Search functionality
    if (search) {
      query = query.where((builder) => {
        builder
          .where('name', 'like', `%${search}%`)
          .orWhere('email', 'like', `%${search}%`)
          .orWhere('username', 'like', `%${search}%`)
          .orWhere('first_name', 'like', `%${search}%`)
          .orWhere('last_name', 'like', `%${search}%`);
      });
    }

    // Get total count
    const [{ count }] = await query.clone().count('* as count');
    const total = parseInt(count);

    // Apply sorting and pagination
    const users = await query
      .select(
        'id',
        'name',
        'email',
        'username',
        'first_name',
        'last_name',
        'status',
        'address',
        'country',
        'city',
        'state',
        'created_at',
        'updated_at'
      )
      .orderBy(sortBy, sortOrder)
      .limit(limit)
      .offset(offset);

    return {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Update user by ID
   * @param {number} id - User ID
   * @param {Object} userData - Updated user data
   * @returns {Promise<Object|null>}
   */
  static async update(id, userData) {
    const sanitized = sanitizeObject(userData);
    sanitized.updated_at = knex.fn.now();

    const [user] = await knex('users')
      .where({ id })
      .whereNull('deleted_at')
      .update(sanitized)
      .returning('*');
    
    return user || null;
  }

  /**
   * Soft delete user by ID
   * @param {number} id - User ID
   * @returns {Promise<boolean>}
   */
  static async delete(id) {
    const result = await knex('users')
      .where({ id })
      .whereNull('deleted_at')
      .update({
        deleted_at: knex.fn.now(),
        updated_at: knex.fn.now()
      });
    return result > 0;
  }

  /**
   * Check if email exists
   * @param {string} email - Email to check
   * @param {number} excludeId - User ID to exclude from check
   * @returns {Promise<boolean>}
   */
  static async emailExists(email, excludeId = null) {
    let query = knex('users').where({ email }).whereNull('deleted_at');
    
    if (excludeId) {
      query = query.whereNot({ id: excludeId });
    }
    
    const user = await query.first();
    return !!user;
  }

  /**
   * Check if username exists
   * @param {string} username - Username to check
   * @param {number} excludeId - User ID to exclude from check
   * @returns {Promise<boolean>}
   */
  static async usernameExists(username, excludeId = null) {
    let query = knex('users').where({ username }).whereNull('deleted_at');
    
    if (excludeId) {
      query = query.whereNot({ id: excludeId });
    }
    
    const user = await query.first();
    return !!user;
  }
}

module.exports = UserModel;

