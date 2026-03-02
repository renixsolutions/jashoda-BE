const express = require('express');
const { body } = require('express-validator');
const GenderController = require('./gender.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');

const router = express.Router();

const createValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
  validate
];

// Protect all admin gender routes
router.use(authenticate);

router.get('/', GenderController.list);
router.post('/', createValidation, GenderController.create);
router.delete('/:id', GenderController.remove);

module.exports = router;

