const express = require('express');
const { body } = require('express-validator');
const OccasionController = require('./occasion.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');

const router = express.Router();

const createOrUpdateValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('slug').optional().isString(),
  body('image_url').optional().isString().withMessage('Image URL must be a string'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
  validate
];

router.use(authenticate);

router.get('/', OccasionController.list);
router.get('/all', OccasionController.getAllActive);
router.get('/:id', OccasionController.getById);
router.post('/', createOrUpdateValidation, OccasionController.create);
router.put('/:id', createOrUpdateValidation, OccasionController.update);
router.delete('/:id', OccasionController.remove);

module.exports = router;
