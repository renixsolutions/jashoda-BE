const express = require('express');
const RingSizeController = require('./ring-size.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = express.Router();

// Public/Common routes
router.get('/active', RingSizeController.getAllActive);

// Admin routes (protected)
router.use(authenticate);
router.get('/', RingSizeController.list);
router.post('/', RingSizeController.create);
router.put('/:id', RingSizeController.update);
router.delete('/:id', RingSizeController.remove);

module.exports = router;
