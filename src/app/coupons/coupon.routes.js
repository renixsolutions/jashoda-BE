const express = require('express');
const couponController = require('./coupon.controller');
const router = express.Router();

const { optionalAuth } = require('../../middlewares/auth.middleware');

router.post('/validate', optionalAuth, couponController.validateCoupon);
router.get('/', optionalAuth, couponController.getAllOffers); // For public display if needed

module.exports = router;
