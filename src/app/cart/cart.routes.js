const express = require('express');
const { body, param } = require('express-validator');
const CartController = require('./cart.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/', CartController.getCart);
router.post(
  '/items',
  [
    body('product_id').isInt({ min: 1 }).withMessage('Valid product_id is required'),
    body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1')
  ],
  validate,
  CartController.addToCart
);
router.put(
  '/items/:id',
  [
    param('id').isInt({ min: 1 }).withMessage('Valid cart item id is required'),
    body('quantity').isInt({ min: 0 }).withMessage('Quantity must be 0 or more')
  ],
  validate,
  CartController.updateItem
);
router.delete(
  '/items/:id',
  [param('id').isInt({ min: 1 }).withMessage('Valid cart item id is required')],
  validate,
  CartController.removeItem
);
router.delete('/', CartController.clearCart);

module.exports = router;
