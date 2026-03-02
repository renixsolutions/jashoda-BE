const express = require('express');
const OccasionController = require('./occasion.controller');

const router = express.Router();

// Website: list active occasions (no auth)
router.get('/', OccasionController.getAllActive);

module.exports = router;
