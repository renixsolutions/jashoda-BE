const express = require('express');
const { body, param } = require('express-validator');
const OrderController = require('./order.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');

const router = express.Router();

router.use(authenticate);

router.post(
  '/',
  [
    body('payment_method').isIn(['razorpay', 'cod']).withMessage('payment_method must be razorpay or cod'),
    body('shipping_address').optional({ nullable: true }).isObject().withMessage('shipping_address must be an object'),
    body('shipping_address.name').optional().isString(),
    body('shipping_address.phone').optional().isString(),
    body('shipping_address.address').optional().isString(),
    body('shipping_address.city').optional().isString(),
    body('shipping_address.state').optional().isString(),
    body('shipping_address.pincode').optional().isString(),
    body('shipping_address_id').optional().isInt({ min: 1 }).withMessage('shipping_address_id must be a valid address id')
  ],
  validate,
  OrderController.placeOrder
);
router.post(
  '/verify-payment',
  [
    body('order_id').isInt({ min: 1 }).withMessage('order_id is required'),
    body('razorpay_order_id').notEmpty().withMessage('razorpay_order_id is required'),
    body('razorpay_payment_id').notEmpty().withMessage('razorpay_payment_id is required'),
    body('razorpay_signature').notEmpty().withMessage('razorpay_signature is required')
  ],
  validate,
  OrderController.verifyPayment
);
router.get('/', OrderController.getMyOrders);
router.get('/:id', [param('id').isInt({ min: 1 })], validate, OrderController.getOrder);
router.post('/:id/payment-failed', [param('id').isInt({ min: 1 })], validate, OrderController.reportPaymentFailed);

module.exports = router;
