const express = require('express');
const PromoController = require('./promo.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/', PromoController.getAll);
router.post('/', PromoController.create);
router.put('/:id', PromoController.update);
router.delete('/:id', PromoController.delete);

module.exports = router;
