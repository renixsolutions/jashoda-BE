const express = require('express');
const { body } = require('express-validator');
const ProductController = require('./product.controller');
const { optionalAuth, authenticate } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');

const router = express.Router();

const createReviewValidation = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('review_title').optional({ nullable: true }).isString().isLength({ max: 255 }),
  body('review_description').optional({ nullable: true }).isString(),
  body('images').optional({ nullable: true }).isArray({ max: 3 }).withMessage('Images must be an array with at most 3 URLs'),
  body('images.*').optional().isString().withMessage('Each image must be a URL string'),
  validate
];

router.get('/', optionalAuth, ProductController.list);
router.get('/:id/reviews', ProductController.getReviews);
router.get('/:id/review-eligibility', authenticate, ProductController.checkReviewEligibility);
router.post('/:id/reviews', authenticate, createReviewValidation, ProductController.createReview);
router.get('/:id', optionalAuth, ProductController.getById);

module.exports = router;
