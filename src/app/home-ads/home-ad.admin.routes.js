const express = require('express');
const HomeAdController = require('./home-ad.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/', HomeAdController.getAll);
router.post('/', HomeAdController.create);
router.put('/:id', HomeAdController.update);
router.delete('/:id', HomeAdController.delete);

module.exports = router;
