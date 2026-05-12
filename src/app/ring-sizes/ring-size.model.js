const knex = require('../../db/knex');
const { sanitizeObject } = require('../../utils/helpers');

class RingSizeModel {
  static async create(data) {
    const sanitized = sanitizeObject(data);
    const [row] = await knex('ring_sizes')
      .insert(sanitized)
      .returning('*');
    return row;
  }

  static async findById(id) {
    return knex('ring_sizes').where({ id }).first();
  }

  static async findAll(options = {}) {
    const {
      page = 1,
      limit = 50,
      isActive,
      search,
      sortBy = 'size',
      sortOrder = 'asc'
    } = options;

    const offset = (page - 1) * limit;
    let query = knex('ring_sizes');

    if (isActive !== undefined) {
      query = query.where({ is_active: isActive === 'true' || isActive === true });
    }

    if (search) {
      query = query.where((builder) => {
        builder
          .where('size', 'ilike', `%${search}%`)
          .orWhere('diameter', 'ilike', `%${search}%`);
      });
    }

    const [{ count }] = await query.clone().count('* as count');
    const total = parseInt(count, 10) || 0;

    const rows = await query
      .select('*')
      .orderBy(sortBy, sortOrder)
      .limit(limit)
      .offset(offset);

    return {
      data: rows,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async getAllActive() {
    return knex('ring_sizes')
      .where({ is_active: true })
      .orderBy('size', 'asc');
  }

  static async update(id, data) {
    const sanitized = sanitizeObject(data);
    sanitized.updated_at = knex.fn.now();
    const [row] = await knex('ring_sizes')
      .where({ id })
      .update(sanitized)
      .returning('*');
    return row || null;
  }

  static async delete(id) {
    return knex('ring_sizes').where({ id }).del();
  }
}

module.exports = RingSizeModel;
