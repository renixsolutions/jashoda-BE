const knex = require('../../db/connection').knex;

class Coupon {
  static async findAll(activeOnly = false) {
    let query = knex('coupons').select('*').orderBy('created_at', 'desc');
    if (activeOnly) {
      query = query.where('is_active', true).where('expiry_date', '>=', new Date());
    }
    return await query;
  }

  static async findById(id) {
    return await knex('coupons').where({ id }).first();
  }

  static async findByCode(code) {
    return await knex('coupons').where({ code }).first();
  }

  static async create(data) {
    const [id] = await knex('coupons').insert({
      ...data,
      created_at: new Date(),
      updated_at: new Date()
    }).returning('id');
    return typeof id === 'object' ? id.id : id;
  }

  static async update(id, data) {
    return await knex('coupons').where({ id }).update({
      ...data,
      updated_at: new Date()
    });
  }

  static async delete(id) {
    return await knex('coupons').where({ id }).del();
  }

  static async getStats() {
    const total = await knex('coupons').count('id as count').first();
    const active = await knex('coupons').where('is_active', true).where('expiry_date', '>=', new Date()).count('id as count').first();
    const expired = await knex('coupons').where('expiry_date', '<', new Date()).count('id as count').first();
    
    return {
      total_offers: parseInt(total.count) || 0,
      active_offers: parseInt(active.count) || 0,
      expired_offers: parseInt(expired.count) || 0,
      total_usage: 0,
      total_savings: 0,
      avg_usage_rate: "0"
    };
  }
}

module.exports = Coupon;
