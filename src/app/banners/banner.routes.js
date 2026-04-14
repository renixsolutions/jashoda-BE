const express = require('express');
const BannerController = require('./banner.controller');

const router = express.Router();

router.get('/', BannerController.getAll);
router.get('/:id', BannerController.getById);

module.exports = router;
