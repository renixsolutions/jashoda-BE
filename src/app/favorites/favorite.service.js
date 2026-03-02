const FavoriteModel = require('./favorite.model');
const ProductModel = require('../products/product.model');
const { toFullUrl } = require('../../utils/helpers');
const config = require('../../config/app');

class FavoriteService {
  static async add(userId, productId) {
    const product = await ProductModel.findById(productId);
    if (!product) throw new Error('Product not found');
    const row = await FavoriteModel.add(userId, productId);
    return { id: row.id, product_id: productId, added: true };
  }

  static async remove(userId, productId) {
    const product = await ProductModel.findById(productId);
    if (!product) throw new Error('Product not found');
    const deleted = await FavoriteModel.remove(userId, productId);
    return { product_id: productId, removed: deleted > 0 };
  }

  static async list(userId) {
    const rows = await FavoriteModel.listByUserId(userId);
    return rows.map((r) => ({
      favorite_id: r.favorite_id,
      product_id: r.product_id,
      favorited_at: r.favorited_at,
      product: {
        id: r.product_id,
        name: r.name,
        slug: r.slug,
        price: parseFloat(r.price),
        discount_price: r.discount_price ? parseFloat(r.discount_price) : null,
        image_url: r.image_url ? toFullUrl(r.image_url, config.appUrl) : r.image_url,
        stock_status: r.stock_status
      }
    }));
  }

  static async isFavorite(userId, productId) {
    if (!userId) return false;
    const row = await FavoriteModel.findByUserAndProduct(userId, productId);
    return !!row;
  }

  static async getFavoriteProductIds(userId) {
    if (!userId) return [];
    return FavoriteModel.getProductIdsByUserId(userId);
  }
}

module.exports = FavoriteService;
