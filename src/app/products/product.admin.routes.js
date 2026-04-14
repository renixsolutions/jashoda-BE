const express = require('express');
const { body } = require('express-validator');
const ProductController = require('./product.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');

const router = express.Router();

const createOrUpdateValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('price').isFloat({ gt: 0 }).withMessage('Price must be greater than 0'),
  body('category').notEmpty().withMessage('Category is required'),
  body('description').optional({ nullable: true }).isString(),
  body('status').optional({ nullable: true }).isIn(['active', 'inactive']).withMessage('Invalid status'),
  body('images')
    .optional({ nullable: true })
    .isArray({ min: 1, max: 5 })
    .withMessage('Images must be an array with 1 to 5 items'),
  body('images.*')
    .optional()
    .isString()
    .withMessage('Each image must be a URL or path string'),
  // New jewelry fields - all optional
  body('gender').optional({ nullable: true }).isString().isLength({ max: 50 }),
  body('sku').optional({ nullable: true }).isString().isLength({ max: 100 }),
  body('subcategory').notEmpty().withMessage('Subcategory is required').isString().isLength({ max: 100 }),
  body('occasion_ids').optional({ nullable: true }).isArray().withMessage('Occasion IDs must be an array'),
  body('occasion_ids.*').optional().toInt().isInt({ min: 1 }).withMessage('Each occasion ID must be valid'),
  body('occasion_id').optional({ nullable: true }).toInt().isInt({ min: 1 }).withMessage('Occasion must be a valid ID'),
  body('brand').optional({ nullable: true }).isString().isLength({ max: 100 }),
  body('short_description').optional({ nullable: true }).isString(),
  body('discount_price').optional({ nullable: true }).isFloat({ min: 0 }),
  body('making_charges').optional({ nullable: true }).isFloat({ min: 0 }),
  body('gst_percentage').optional({ nullable: true }).isFloat({ min: 0, max: 100 }),
  body('currency').optional({ nullable: true }).isString().isLength({ max: 10 }),
  body('price_label').optional({ nullable: true }).isString().isLength({ max: 100 }),
  body('offer_start_date').optional({ nullable: true }).isISO8601(),
  body('offer_end_date').optional({ nullable: true }).isISO8601(),
  body('metal_type').optional({ nullable: true }).isString().isLength({ max: 50 }),
  body('purity').optional({ nullable: true }).isString().isLength({ max: 50 }),
  body('metal_weight').optional({ nullable: true }).isFloat({ min: 0 }),
  body('stone_type').optional({ nullable: true }).isString().isLength({ max: 50 }),
  body('stone_weight').optional({ nullable: true }).isFloat({ min: 0 }),
  body('stone_count').optional({ nullable: true }).isInt({ min: 0 }),
  body('certification').optional({ nullable: true }).isString().isLength({ max: 100 }),
  body('length').optional({ nullable: true }).isFloat({ min: 0 }),
  body('width').optional({ nullable: true }).isFloat({ min: 0 }),
  body('ring_size').optional({ nullable: true }).isString().isLength({ max: 20 }),
  body('stock_quantity').optional({ nullable: true }).isInt({ min: 0 }),
  body('low_stock_threshold').optional({ nullable: true }).isInt({ min: 0 }),
  body('stock_status').optional({ nullable: true }).isIn(['in_stock', 'out_of_stock', 'low_stock']),
  body('meta_title').optional({ nullable: true }).isString().isLength({ max: 255 }),
  body('meta_description').optional({ nullable: true }).isString(),
  body('tags').optional({ nullable: true }).isString().isLength({ max: 500 }),
  body('weight').optional({ nullable: true }).isFloat({ min: 0 }),
  body('shipping_class').optional({ nullable: true }).isString().isLength({ max: 50 }),
  body('returnable').optional({ nullable: true }).isBoolean(),
  body('warranty').optional({ nullable: true }).isString().isLength({ max: 100 }),
  body('variants').optional({ nullable: true }).isObject(),
  body('hover_image_url').optional({ nullable: true }).isString().isLength({ max: 500 }),
  body('video_url').optional({ nullable: true }).isString().isLength({ max: 500 }),
  validate
];

// Protect all admin product routes
router.use(authenticate);

router.get('/', ProductController.list);
router.get('/reviews', ProductController.listReviews);
router.put('/reviews/:id', ProductController.updateReview);
router.delete('/reviews/:id', ProductController.removeReview);
router.get('/:id', ProductController.getById);
router.post('/', createOrUpdateValidation, ProductController.create);
router.put('/:id', createOrUpdateValidation, ProductController.update);
router.delete('/:id', ProductController.remove);

module.exports = router;


