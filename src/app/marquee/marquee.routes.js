const express = require('express');
const router = express.Router();
const marqueeController = require('./marquee.controller');

router.get('/', marqueeController.getMarquee);

module.exports = router;
