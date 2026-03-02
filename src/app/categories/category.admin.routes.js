const express = require('express');
const { body } = require('express-validator');
const CategoryController = require('./category.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');

const router = express.Router();

const createOrUpdateValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('slug').optional().isString(),
  body('description').optional().isString(),
  body('image_url').optional().isString().withMessage('Image URL must be a string'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
  body('parent_id').optional().isInt().withMessage('Parent ID must be an integer'),
  validate
];

// Protect all admin category routes
router.use(authenticate);

router.get('/', CategoryController.list);
router.get('/parents', CategoryController.getParents);
router.get('/subcategories/:parentId', CategoryController.getSubcategories);
router.get('/:id', CategoryController.getById);
router.post('/', createOrUpdateValidation, CategoryController.create);
router.put('/:id', createOrUpdateValidation, CategoryController.update);
router.delete('/:id', CategoryController.remove);

module.exports = router;


