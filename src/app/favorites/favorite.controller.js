const FavoriteService = require('./favorite.service');
const { sendSuccess, sendError } = require('../../utils/response');
const messages = require('../../constants/messages');
const logger = require('../../utils/logger');

class FavoriteController {
  static async add(req, res) {
    try {
      const userId = req.user.id;
      const { product_id } = req.body;
      const result = await FavoriteService.add(userId, product_id);
      return sendSuccess(res, 200, 'Added to favorites', result);
    } catch (error) {
      logger.error('Add favorite error:', error);
      if (error.message === 'Product not found') return sendError(res, 404, error.message);
      return sendError(res, 500, error.message || messages.ERROR);
    }
  }

  static async remove(req, res) {
    try {
      const userId = req.user.id;
      const productId = req.params.productId;
      const result = await FavoriteService.remove(userId, productId);
      return sendSuccess(res, 200, 'Removed from favorites', result);
    } catch (error) {
      logger.error('Remove favorite error:', error);
      if (error.message === 'Product not found') return sendError(res, 404, error.message);
      return sendError(res, 500, error.message || messages.ERROR);
    }
  }

  static async list(req, res) {
    try {
      const userId = req.user.id;
      const list = await FavoriteService.list(userId);
      return sendSuccess(res, 200, 'Favorites fetched successfully', { items: list });
    } catch (error) {
      logger.error('List favorites error:', error);
      return sendError(res, 500, error.message || messages.ERROR);
    }
  }

  static async check(req, res) {
    try {
      const userId = req.user.id;
      const productId = req.query.product_id || req.params.productId;
      const isFavorite = await FavoriteService.isFavorite(userId, parseInt(productId, 10));
      return sendSuccess(res, 200, 'OK', { product_id: parseInt(productId, 10), is_favorite: isFavorite });
    } catch (error) {
      logger.error('Check favorite error:', error);
      return sendError(res, 500, error.message || messages.ERROR);
    }
  }
}

module.exports = FavoriteController;
