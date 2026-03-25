const express = require('express');
const PromoController = require('./promo.controller');

const router = express.Router();

// Public route to get promo videos
router.get('/', PromoController.getAll);

module.exports = router;
