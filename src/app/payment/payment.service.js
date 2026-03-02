const Razorpay = require('razorpay');
const crypto = require('crypto');
const appConfig = require('../../config/app');

let razorpayInstance = null;

function getRazorpay() {
  if (!appConfig.razorpay?.keyId || !appConfig.razorpay?.keySecret) {
    return null;
  }
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: appConfig.razorpay.keyId,
      key_secret: appConfig.razorpay.keySecret
    });
  }
  return razorpayInstance;
}

class PaymentService {
  /**
   * Create a Razorpay order for the given amount (in INR).
   * @param {number} orderId - Our order id (for reference/receipt)
   * @param {number} amountInr - Order total in INR
   * @returns {Promise<{ id: string }|null>}
   */
  static async createRazorpayOrder(orderId, amountInr) {
    const rzp = getRazorpay();
    if (!rzp) return null;

    const amountPaise = Math.round(amountInr * 100);
    const options = {
      amount: amountPaise,
      currency: 'INR',
      receipt: `order_${orderId}`,
      notes: { order_id: String(orderId) }
    };

    try {
      const order = await rzp.orders.create(options);
      return order;
    } catch (err) {
      throw new Error(err.message || 'Failed to create Razorpay order');
    }
  }

  /**
   * Verify Razorpay payment signature.
   * @param {string} razorpayOrderId
   * @param {string} razorpayPaymentId
   * @param {string} signature
   * @returns {boolean}
   */
  static async verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, signature) {
    if (!appConfig.razorpay?.keySecret) return false;
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expected = crypto.createHmac('sha256', appConfig.razorpay.keySecret).update(body).digest('hex');
    return expected === signature;
  }
}

module.exports = PaymentService;
