const CartService = require('./cart.service');
const { sendSuccess, sendError } = require('../../utils/response');
const messages = require('../../constants/messages');
const logger = require('../../utils/logger');

class CartController {
  static async getCart(req, res) {
    try {
      const userId = req.user?.id;
      if (userId == null) {
        return sendError(res, 401, messages.TOKEN_REQUIRED);
      }
      const cart = await CartService.getCartWithItems(userId);
      return sendSuccess(res, 200, 'Cart fetched successfully', cart);
    } catch (error) {
      logger.error('Get cart error:', error);
      return sendError(res, 500, error.message || messages.ERROR);
    }
  }

  static async addToCart(req, res) {
    try {
      const userId = req.user.id;
      const { product_id, quantity = 1, size_id } = req.body;
      const cart = await CartService.addToCart(userId, product_id, quantity, size_id);
      return sendSuccess(res, 200, 'Item added to cart', cart);
    } catch (error) {
      logger.error('Add to cart error:', error);
      if (error.message === 'Product not found' || error.message === 'Insufficient stock or product is out of stock') {
        return sendError(res, 400, error.message);
      }
      return sendError(res, 500, error.message || messages.ERROR);
    }
  }

  static async updateItem(req, res) {
    try {
      const userId = req.user.id;
      const { id: cartItemId } = req.params;
      const { quantity } = req.body;
      const cart = await CartService.updateItem(userId, cartItemId, quantity);
      return sendSuccess(res, 200, 'Cart updated', cart);
    } catch (error) {
      logger.error('Update cart item error:', error);
      if (error.message === 'Cart item not found' || error.message === 'Insufficient stock') {
        return sendError(res, 400, error.message);
      }
      return sendError(res, 500, error.message || messages.ERROR);
    }
  }

  static async removeItem(req, res) {
    try {
      const userId = req.user.id;
      const { id: cartItemId } = req.params;
      const cart = await CartService.removeItem(userId, cartItemId);
      return sendSuccess(res, 200, 'Item removed from cart', cart);
    } catch (error) {
      logger.error('Remove cart item error:', error);
      if (error.message === 'Cart item not found') return sendError(res, 404, error.message);
      return sendError(res, 500, error.message || messages.ERROR);
    }
  }

  static async clearCart(req, res) {
    try {
      const userId = req.user.id;
      const cart = await CartService.clearCart(userId);
      return sendSuccess(res, 200, 'Cart cleared', cart);
    } catch (error) {
      logger.error('Clear cart error:', error);
      return sendError(res, 500, error.message || messages.ERROR);
    }
  }
}

module.exports = CartController;
