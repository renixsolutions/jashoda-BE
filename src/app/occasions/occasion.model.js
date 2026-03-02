const knex = require('../../db/knex');
const { sanitizeObject } = require('../../utils/helpers');

class OccasionModel {
  static async create(occasionData) {
    const sanitized = sanitizeObject(occasionData);
    const [occasion] = await knex('occasions')
      .insert(sanitized)
      .returning('*');
    return occasion;
  }

  static async findById(id) {
    return knex('occasions').where({ id }).first();
  }

  static async findBySlug(slug) {
    return knex('occasions').where({ slug }).first();
  }

  static async findAll(options = {}) {
    const {
      page = 1,
      limit = 50,
      status = 'active',
      search,
      sortBy = 'name',
      sortOrder = 'asc'
    } = options;

    const offset = (page - 1) * limit;
    let query = knex('occasions');

    if (status) {
      query = query.where({ status });
    }

    if (search) {
      query = query.where((builder) => {
        builder
          .where('name', 'ilike', `%${search}%`)
          .orWhere('slug', 'ilike', `%${search}%`);
      });
    }

    const [{ count }] = await query.clone().count('* as count');
    const total = parseInt(count, 10) || 0;

    const occasions = await query
      .select('*')
      .orderBy(sortBy, sortOrder)
      .limit(limit)
      .offset(offset);

    return {
      occasions,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async getAllActive() {
    return knex('occasions')
      .where({ status: 'active' })
      .orderBy('name', 'asc');
  }

  static async update(id, occasionData) {
    const sanitized = sanitizeObject(occasionData);
    sanitized.updated_at = knex.fn.now();
    const [occasion] = await knex('occasions')
      .where({ id })
      .update(sanitized)
      .returning('*');
    return occasion || null;
  }

  static async delete(id) {
    return knex('occasions').where({ id }).del();
  }
}

module.exports = OccasionModel;
