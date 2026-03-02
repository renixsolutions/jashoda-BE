const knex = require('../../db/knex');
const { sanitizeObject } = require('../../utils/helpers');

class UserAddressModel {
  static async listByUserId(userId) {
    return knex('user_addresses')
      .where({ user_id: userId })
      .orderBy('is_default', 'desc')
      .orderBy('created_at', 'desc');
  }

  static async findByIdForUser(userId, addressId) {
    return knex('user_addresses')
      .where({ user_id: userId, id: addressId })
      .first();
  }

  static async clearDefault(userId) {
    return knex('user_addresses')
      .where({ user_id: userId, is_default: true })
      .update({ is_default: false, updated_at: knex.fn.now() });
  }

  static async createForUser(userId, data) {
    const sanitized = sanitizeObject({
      ...data,
      user_id: userId
    });
    const [row] = await knex('user_addresses').insert(sanitized).returning('*');
    return row;
  }

  static async updateForUser(userId, addressId, data) {
    const sanitized = sanitizeObject(data);
    sanitized.updated_at = knex.fn.now();
    const [row] = await knex('user_addresses')
      .where({ user_id: userId, id: addressId })
      .update(sanitized)
      .returning('*');
    return row || null;
  }

  static async deleteForUser(userId, addressId) {
    return knex('user_addresses').where({ user_id: userId, id: addressId }).del();
  }
}

module.exports = UserAddressModel;

