const express = require('express');
const { body } = require('express-validator');
const CollectionController = require('./collection.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');

const router = express.Router();

const validationRules = [
  body('name').notEmpty().withMessage('Name is required'),
  body('is_active').optional().isBoolean(),
  body('sort_order').optional().isInt(),
  validate
];

router.use(authenticate);

router.get('/', CollectionController.list);
router.get('/:id', CollectionController.getById);
router.post('/', validationRules, CollectionController.create);
router.put('/:id', validationRules, CollectionController.update);
router.delete('/:id', CollectionController.remove);

module.exports = router;
