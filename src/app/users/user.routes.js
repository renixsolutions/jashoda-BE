const express = require('express');
const { body } = require('express-validator');
const UserController = require('./user.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const messages = require('../../constants/messages');

const router = express.Router();

// Validation rules
const createUserValidation = [
  body('name').notEmpty().withMessage(messages.NAME_REQUIRED),
  body('email').isEmail().withMessage(messages.EMAIL_INVALID).notEmpty().withMessage(messages.EMAIL_REQUIRED),
  body('username').notEmpty().withMessage(messages.USERNAME_REQUIRED),
  body('first_name').notEmpty().withMessage(messages.FIRST_NAME_REQUIRED),
  body('last_name').notEmpty().withMessage(messages.LAST_NAME_REQUIRED),
  body('password').isLength({ min: 8 }).withMessage(messages.PASSWORD_WEAK).notEmpty().withMessage(messages.PASSWORD_REQUIRED),
  validate
];

const updateUserValidation = [
  body('email').optional().isEmail().withMessage(messages.EMAIL_INVALID),
  body('password').optional().isLength({ min: 8 }).withMessage(messages.PASSWORD_WEAK),
  validate
];

const loginValidation = [
  body('email').isEmail().withMessage(messages.EMAIL_INVALID).notEmpty().withMessage(messages.EMAIL_REQUIRED),
  body('password').notEmpty().withMessage(messages.PASSWORD_REQUIRED),
  validate
];

// Public routes
router.post('/login', loginValidation, UserController.login);
router.post('/register', createUserValidation, UserController.create);

// Protected routes
router.get('/', authenticate, UserController.getAll);
router.get('/:id', authenticate, UserController.getById);
router.put('/:id', authenticate, updateUserValidation, UserController.update);
router.delete('/:id', authenticate, UserController.delete);

module.exports = router;

