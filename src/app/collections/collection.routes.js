const express = require('express');
const CollectionController = require('./collection.controller');

const router = express.Router();

router.get('/', CollectionController.list);
router.get('/:id', CollectionController.getById);
router.get('/:id/products', CollectionController.getProducts);

module.exports = router;
