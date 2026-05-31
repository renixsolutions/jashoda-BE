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
   * Find user by phone
   * @param {string} phone - Phone number
   * @returns {Promise<Object|null>}
   */
  static async findByPhone(phone) {
    const user = await knex('users')
      .where({ phone })
      .whereNull('deleted_at')
      .first();
    return user;
  }

  /**
   * Find user by email verification token
   * @param {string} token - Email verification token
   * @returns {Promise<Object|null>}
   */
  static async findByEmailVerificationToken(token) {
    const user = await knex('users')
      .where({ email_verification_token: token })
      .whereNull('deleted_at')
      .where('email_verification_expires_at', '>', knex.fn.now())
      .first();
    return user;
  }

  /**
   * Set email verified and clear verification token
   * @param {number} id - User ID
   * @returns {Promise<Object|null>}
   */
  static async setEmailVerified(id) {
    const [user] = await knex('users')
      .where({ id })
      .whereNull('deleted_at')
      .update({
        email_verified: true,
        email_verification_token: null,
        email_verification_expires_at: null,
        updated_at: knex.fn.now()
      })
      .returning('*');
    return user || null;
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
        'phone',
        'title',
        'email_verified',
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

  // ─── Admin Security Methods ────────────────────────────────────────

  /** Find admin user by password reset token hash */
  static async findByResetToken(tokenHash) {
    return knex('users')
      .where({ reset_password_token_hash: tokenHash })
      .whereNull('deleted_at')
      .first();
  }

  /** Store a hashed password reset token */
  static async setResetToken(id, tokenHash, expiresAt) {
    return knex('users').where({ id }).update({
      reset_password_token_hash: tokenHash,
      reset_password_expires_at: expiresAt,
      updated_at: knex.fn.now(),
    });
  }

  /** Clear password reset token after use */
  static async clearResetToken(id) {
    return knex('users').where({ id }).update({
      reset_password_token_hash: null,
      reset_password_expires_at: null,
      updated_at: knex.fn.now(),
    });
  }

  /** Store a hashed 2FA OTP code */
  static async setTwoFaCode(id, codeHash, expiresAt) {
    return knex('users').where({ id }).update({
      two_fa_code_hash: codeHash,
      two_fa_expires_at: expiresAt,
      two_fa_attempts: 0,
      updated_at: knex.fn.now(),
    });
  }

  /** Clear 2FA OTP data after use or expiry */
  static async clearTwoFaCode(id) {
    return knex('users').where({ id }).update({
      two_fa_code_hash: null,
      two_fa_expires_at: null,
      two_fa_attempts: 0,
      updated_at: knex.fn.now(),
    });
  }

  /** Increment failed 2FA attempt counter */
  static async incrementTwoFaAttempts(id) {
    return knex('users').where({ id }).increment('two_fa_attempts', 1);
  }

  // ─────────────────────────────────────────────────────────────────────

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

