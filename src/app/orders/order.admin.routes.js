const express = require('express');
const { body, param } = require('express-validator');
const OrderAdminController = require('./order.admin.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/', OrderAdminController.list);
router.get('/:id', [param('id').isInt({ min: 1 })], validate, OrderAdminController.getOrder);
router.patch(
  '/:id/status',
  [
    param('id').isInt({ min: 1 }).withMessage('Valid order id is required'),
    body('status')
      .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
      .withMessage('Invalid status')
  ],
  validate,
  OrderAdminController.updateStatus
);

module.exports = router;
