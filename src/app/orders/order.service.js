const OrderModel = require('./order.model');
const CartModel = require('../cart/cart.model');
const CartService = require('../cart/cart.service');
const ProductModel = require('../products/product.model');
const { decrementStock } = require('../products/product.stock.service');
const PaymentService = require('../payment/payment.service');
const messages = require('../../constants/messages');
const UserModel = require('../users/user.model');
const UserAddressModel = require('../users/user.address.model');

function generateOrderNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORD-${date}-${random}`;
}

class OrderService {
  static async placeOrder(userId, { payment_method, shipping_address, shipping_address_id }) {
    const cartData = await CartService.getCartWithItems(userId);
    if (!cartData.items || cartData.items.length === 0) {
      throw new Error('Cart is empty');
    }

    // Validate stock again before placing order
    for (const item of cartData.items) {
      const product = await ProductModel.findById(item.product_id);
      const stock = parseInt(product.stock_quantity, 10) || 0;
      if (stock < item.quantity) {
        throw new Error(`Insufficient stock for product: ${item.product.name}`);
      }
    }

    const subtotal = cartData.subtotal;
    const tax = 0;
    const shipping = 0;
    const discount = 0;
    const total = Math.round((subtotal + tax + shipping - discount) * 100) / 100;

    let orderNumber = generateOrderNumber();
    while (await OrderModel.findByOrderNumber(orderNumber)) {
      orderNumber = generateOrderNumber();
    }

    let finalShippingAddress = shipping_address || null;
    if (!finalShippingAddress && shipping_address_id) {
      // Try to load saved address and map to shipping_address shape
      const address = await UserAddressModel.findByIdForUser(userId, shipping_address_id);
      if (!address) {
        throw new Error('Selected shipping address not found');
      }
      finalShippingAddress = {
        name: address.name || undefined,
        phone: address.phone || undefined,
        address: address.address,
        city: address.city || undefined,
        state: address.state || undefined,
        pincode: address.pincode || undefined,
        country: address.country || undefined,
        label: address.label || undefined
      };
    }

    const order = await OrderModel.create({
      user_id: userId,
      order_number: orderNumber,
      status: payment_method === 'cod' ? 'confirmed' : 'pending',
      payment_method,
      payment_status: payment_method === 'cod' ? 'pending' : 'pending',
      subtotal,
      tax,
      shipping,
      discount,
      total,
      shipping_address: finalShippingAddress
    });

    for (const item of cartData.items) {
      await OrderModel.createOrderItem({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        product_name: item.product.name,
        sku: item.product.sku || null
      });
    }

    if (payment_method === 'cod') {
      for (const item of cartData.items) {
        await decrementStock(item.product_id, item.quantity);
      }
      await CartModel.clearCart(cartData.cart_id);
      return this.getOrderById(order.id, userId);
    }

    // Razorpay: create payment order; stock and cart cleared only after payment verify
    const razorpayOrder = await PaymentService.createRazorpayOrder(order.id, total);
    if (razorpayOrder && razorpayOrder.id) {
      await OrderModel.update(order.id, { razorpay_order_id: razorpayOrder.id });
    }
    const orderWithRazorpay = await this.getOrderById(order.id, userId);
    return {
      ...orderWithRazorpay,
      razorpay_order_id: razorpayOrder?.id || null,
      razorpay_amount: Math.round(total * 100), // amount in paise
      razorpay_currency: 'INR'
    };
  }

  static async verifyRazorpayPayment(userId, orderId, { razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
    const order = await OrderModel.findById(orderId);
    if (!order) throw new Error(messages.NOT_FOUND);
    if (order.user_id !== userId) throw new Error(messages.NOT_FOUND);
    if (order.payment_method !== 'razorpay') throw new Error('Order is not a Razorpay order');
    if (order.payment_status === 'paid') return this.getOrderById(orderId, userId);

    const valid = await PaymentService.verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );
    if (!valid) throw new Error('Payment verification failed');

    const items = await OrderModel.getOrderItems(orderId);
    for (const item of items) {
      await decrementStock(item.product_id, item.quantity);
    }
    const cart = await CartModel.findOrCreateByUserId(userId);
    await CartModel.clearCart(cart.id);

    await OrderModel.update(orderId, {
      payment_status: 'paid',
      razorpay_payment_id,
      status: 'confirmed'
    });
    return this.getOrderById(orderId, userId);
  }

  static async getOrderById(orderId, userId, admin = false) {
    const order = await OrderModel.findById(orderId);
    if (!order) throw new Error(messages.NOT_FOUND);
    if (!admin && order.user_id !== userId) throw new Error(messages.NOT_FOUND);

    const items = await OrderModel.getOrderItems(orderId);
    let user = null;
    if (order.user_id) {
      user = await UserModel.findById(order.user_id);
      if (user && user.password) {
        delete user.password;
      }
    }
    return {
      ...order,
      subtotal: parseFloat(order.subtotal),
      tax: parseFloat(order.tax),
      shipping: parseFloat(order.shipping),
      discount: parseFloat(order.discount),
      total: parseFloat(order.total),
      items,
      user
    };
  }

  static async getMyOrders(userId, options = {}) {
    const result = await OrderModel.findByUserId(userId, options);
    return result;
  }

  static async listOrders(options = {}) {
    return OrderModel.findAll(options);
  }

  static async updateOrderStatus(orderId, status) {
    const order = await OrderModel.findById(orderId);
    if (!order) throw new Error(messages.NOT_FOUND);
    const valid = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!valid.includes(status)) throw new Error('Invalid order status');

    const updated = await OrderModel.update(orderId, { status });
    return this.getOrderById(updated.id, updated.user_id, true);
  }

  static async updatePaymentSuccess(orderId, razorpayPaymentId) {
    const order = await OrderModel.findById(orderId);
    if (!order) throw new Error(messages.NOT_FOUND);
    await OrderModel.update(orderId, {
      payment_status: 'paid',
      razorpay_payment_id: razorpayPaymentId,
      status: 'confirmed'
    });
    return this.getOrderById(orderId, order.user_id, true);
  }
}

module.exports = OrderService;
