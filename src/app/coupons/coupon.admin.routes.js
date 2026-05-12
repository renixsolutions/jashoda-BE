const express = require('express');
const couponController = require('./coupon.controller');
const router = express.Router();

router.get('/', couponController.getAllOffers);
router.get('/stats', couponController.getStats);
router.get('/:id', couponController.getOfferById);
router.post('/', couponController.createOffer);
router.put('/:id', couponController.updateOffer);
router.delete('/:id', couponController.deleteOffer);

module.exports = router;
