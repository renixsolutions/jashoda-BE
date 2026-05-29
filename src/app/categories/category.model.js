const knex = require('../../db/knex');
const { sanitizeObject } = require('../../utils/helpers');

class CategoryModel {
  static async create(categoryData) {
    const sanitized = sanitizeObject(categoryData);
    if (sanitized.gender_images && typeof sanitized.gender_images === 'object') {
      sanitized.gender_images = JSON.stringify(sanitized.gender_images);
    }
    if (sanitized.applicable_genders && Array.isArray(sanitized.applicable_genders)) {
      sanitized.applicable_genders = JSON.stringify(sanitized.applicable_genders);
    }
    const [category] = await knex('categories')
      .insert(sanitized)
      .returning('*');
    return category;
  }

  static async findById(id) {
    return knex('categories').where({ id }).first();
  }

  static async findBySlug(slug) {
    return knex('categories').where({ slug }).first();
  }

  static async findAll(options = {}) {
    const {
      page = 1,
      limit = 50,
      status = 'active',
      search,
      sortBy = 'created_at',
      sortOrder = 'asc',
      parentId = null
    } = options;

    const offset = (page - 1) * limit;
    let query = knex('categories');

    if (status) {
      query = query.where({ status });
    }

    if (parentId !== null && parentId !== undefined) {
      if (parentId === 'null' || parentId === '') {
        query = query.whereNull('parent_id');
      } else {
        query = query.where({ parent_id: parentId });
      }
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

    const categories = await query
      .select('*')
      .orderBy(sortBy, sortOrder)
      .limit(limit)
      .offset(offset);

    return {
      categories,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async getParentCategories() {
    return knex('categories')
      .whereNull('parent_id')
      .where({ status: 'active' })
      .orderBy('name', 'asc');
  }

  static async getSubcategories(parentId) {
    return knex('categories')
      .where({ parent_id: parentId, status: 'active' })
      .orderBy('name', 'asc');
  }

  static async update(id, categoryData) {
    const sanitized = sanitizeObject(categoryData);
    if (sanitized.gender_images && typeof sanitized.gender_images === 'object') {
      sanitized.gender_images = JSON.stringify(sanitized.gender_images);
    }
    if (sanitized.applicable_genders && Array.isArray(sanitized.applicable_genders)) {
      sanitized.applicable_genders = JSON.stringify(sanitized.applicable_genders);
    }
    sanitized.updated_at = knex.fn.now();
    const [category] = await knex('categories')
      .where({ id })
      .update(sanitized)
      .returning('*');
    return category || null;
  }

  static async delete(id) {
    return knex('categories').where({ id }).del();
  }
}

module.exports = CategoryModel;


