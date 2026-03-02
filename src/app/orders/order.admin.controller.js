const OrderService = require('./order.service');
const { sendSuccess, sendError } = require('../../utils/response');
const messages = require('../../constants/messages');
const logger = require('../../utils/logger');

class OrderAdminController {
  static async list(req, res) {
    try {
      const { page, limit, status, search, userId } = req.query;
      const result = await OrderService.listOrders({
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 20,
        status: status || undefined,
        search: search || undefined,
        userId: userId ? parseInt(userId) : undefined
      });
      return sendSuccess(res, 200, 'Orders fetched successfully', result.orders, {
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Admin list orders error:', error);
      return sendError(res, 500, error.message || messages.ERROR);
    }
  }

  static async getOrder(req, res) {
    try {
      const orderId = req.params.id;
      const order = await OrderService.getOrderById(orderId, null, true);
      return sendSuccess(res, 200, 'Order fetched successfully', order);
    } catch (error) {
      logger.error('Admin get order error:', error);
      if (error.message === messages.NOT_FOUND) return sendError(res, 404, error.message);
      return sendError(res, 500, error.message || messages.ERROR);
    }
  }

  static async updateStatus(req, res) {
    try {
      const orderId = req.params.id;
      const { status } = req.body;
      const order = await OrderService.updateOrderStatus(orderId, status);
      return sendSuccess(res, 200, 'Order status updated', order);
    } catch (error) {
      logger.error('Admin update order status error:', error);
      if (error.message === messages.NOT_FOUND) return sendError(res, 404, error.message);
      if (error.message === 'Invalid order status') return sendError(res, 400, error.message);
      return sendError(res, 500, error.message || messages.ERROR);
    }
  }
}

module.exports = OrderAdminController;
