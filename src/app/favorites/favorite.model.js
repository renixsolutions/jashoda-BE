const knex = require('../../db/knex');

class FavoriteModel {
  static async add(userId, productId) {
    const existing = await this.findByUserAndProduct(userId, productId);
    if (existing) return existing;
    const [row] = await knex('favorites')
      .insert({ user_id: userId, product_id: productId })
      .returning('*');
    return row;
  }

  static async remove(userId, productId) {
    return knex('favorites').where({ user_id: userId, product_id: productId }).del();
  }

  static async findByUserAndProduct(userId, productId) {
    return knex('favorites').where({ user_id: userId, product_id: productId }).first();
  }

  static async getProductIdsByUserId(userId) {
    const rows = await knex('favorites').where({ user_id: userId }).select('product_id');
    return rows.map((r) => r.product_id);
  }

  static async listByUserId(userId) {
    return knex('favorites')
      .where({ 'favorites.user_id': userId })
      .join('products', 'products.id', 'favorites.product_id')
      .select(
        'favorites.id as favorite_id',
        'favorites.product_id',
        'favorites.created_at as favorited_at',
        'products.name',
        'products.slug',
        'products.price',
        'products.discount_price',
        'products.image_url',
        'products.stock_status'
      )
      .orderBy('favorites.created_at', 'desc');
  }
}

module.exports = FavoriteModel;
