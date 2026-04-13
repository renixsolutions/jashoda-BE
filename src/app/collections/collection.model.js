const knex = require('../../db/knex');
const { sanitizeObject } = require('../../utils/helpers');
const slugify = require('slugify');

class CollectionModel {
  static async create(data) {
    const sanitized = sanitizeObject(data);
    if (sanitized.name && !sanitized.slug) {
      sanitized.slug = slugify(sanitized.name, { lower: true, strict: true });
    }
    const [collection] = await knex('collections')
      .insert(sanitized)
      .returning('*');
    return collection;
  }

  static async findById(id) {
    return knex('collections').where({ id }).first();
  }

  static async findBySlug(slug) {
    return knex('collections').where({ slug }).first();
  }

  static async findAll(options = {}) {
    const { isActive, sortBy = 'sort_order', sortOrder = 'asc' } = options;
    let query = knex('collections');
    
    if (isActive !== undefined) {
      const active = isActive === 'true' || isActive === '1' || isActive === 'active' || isActive === true || isActive === 'on';
      query = query.where('is_active', active);
    }
    
    return query.orderBy(sortBy, sortOrder);
  }

  static async update(id, data) {
    const sanitized = sanitizeObject(data);
    if (sanitized.name && !sanitized.slug) {
      sanitized.slug = slugify(sanitized.name, { lower: true, strict: true });
    }
    sanitized.updated_at = knex.fn.now();
    const [collection] = await knex('collections')
      .where({ id })
      .update(sanitized)
      .returning('*');
    return collection;
  }

  static async delete(id) {
    return knex('collections').where({ id }).del();
  }

  static async getProducts(collectionId, options = {}) {
    const { limit = 20, offset = 0 } = options;
    return knex('products')
      .join('product_collections', 'products.id', 'product_collections.product_id')
      .where('product_collections.collection_id', collectionId)
      .where('products.status', 'active')
      .limit(limit)
      .offset(offset)
      .select(
        'products.*',
        'product_collections.collection_id'
      );
  }
}

module.exports = CollectionModel;
