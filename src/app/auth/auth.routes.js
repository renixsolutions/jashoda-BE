const express = require('express');
const { body } = require('express-validator');
const AuthController = require('./auth.controller');
const { validate } = require('../../middlewares/validate.middleware');
const messages = require('../../constants/messages');

const router = express.Router();

const loginValidation = [
  body('email').isEmail().withMessage(messages.EMAIL_INVALID).notEmpty().withMessage(messages.EMAIL_REQUIRED),
  body('password').notEmpty().withMessage(messages.PASSWORD_REQUIRED),
  validate
];

router.post('/login', loginValidation, AuthController.login);

module.exports = router;

