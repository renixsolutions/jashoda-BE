const express = require('express');
const { body, param, query } = require('express-validator');
const FavoriteController = require('./favorite.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/', FavoriteController.list);
router.get('/check', [query('product_id').isInt({ min: 1 })], validate, FavoriteController.check);
router.post(
  '/',
  [body('product_id').isInt({ min: 1 }).withMessage('Valid product_id is required')],
  validate,
  FavoriteController.add
);
router.delete(
  '/:productId',
  [param('productId').isInt({ min: 1 }).withMessage('Valid product_id is required')],
  validate,
  FavoriteController.remove
);

module.exports = router;
