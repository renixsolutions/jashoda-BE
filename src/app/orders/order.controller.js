const OrderService = require('./order.service');
const { sendSuccess, sendError } = require('../../utils/response');
const messages = require('../../constants/messages');
const logger = require('../../utils/logger');

class OrderController {
  static async placeOrder(req, res) {
    try {
      const userId = req.user.id;
      const idempotencyKey = req.headers['x-idempotency-key'];
      const { payment_method, shipping_address, shipping_address_id, coupon_code } = req.body;
      const order = await OrderService.placeOrder(userId, { payment_method, shipping_address, shipping_address_id, coupon_code }, idempotencyKey);
      return sendSuccess(res, 201, 'Order placed successfully', order);
    } catch (error) {
      logger.error('Place order error:', error);
      if (error.message === 'Cart is empty' || error.message.includes('Insufficient stock')) {
        return sendError(res, 400, error.message);
      }
      return sendError(res, 500, error.message || messages.ERROR);
    }
  }

  static async getMyOrders(req, res) {
    try {
      const userId = req.user.id;
      const { page, limit, status } = req.query;
      const result = await OrderService.getMyOrders(userId, {
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 20,
        status: status || undefined
      });
      return sendSuccess(res, 200, 'Orders fetched successfully', result.orders, {
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Get my orders error:', error);
      return sendError(res, 500, error.message || messages.ERROR);
    }
  }

  static async getOrder(req, res) {
    try {
      const userId = req.user.id;
      const orderId = req.params.id;
      const order = await OrderService.getOrderById(orderId, userId);
      return sendSuccess(res, 200, 'Order fetched successfully', order);
    } catch (error) {
      logger.error('Get order error:', error);
      if (error.message === messages.NOT_FOUND) return sendError(res, 404, error.message);
      return sendError(res, 500, error.message || messages.ERROR);
    }
  }

  static async verifyPayment(req, res) {
    try {
      const userId = req.user.id;
      const { order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      const order = await OrderService.verifyRazorpayPayment(userId, order_id, {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      });
      return sendSuccess(res, 200, 'Payment verified successfully', order);
    } catch (error) {
      logger.error('Verify payment error:', error);
      if (error.message === messages.NOT_FOUND) return sendError(res, 404, error.message);
      if (error.message === 'Payment verification failed' || error.message === 'Order is not a Razorpay order') {
        return sendError(res, 400, error.message);
      }
      return sendError(res, 500, error.message || messages.ERROR);
    }
  }

  static async reportPaymentFailed(req, res) {
    try {
      const userId = req.user.id;
      const orderId = req.params.id;
      const { reason } = req.body;
      
      await OrderService.reportPaymentFailed(userId, orderId, reason);
      return sendSuccess(res, 200, 'Payment failure reported successfully');
    } catch (error) {
      logger.error('Report payment failed error:', error);
      return sendError(res, 500, error.message || messages.ERROR);
    }
  }
}

module.exports = OrderController;
