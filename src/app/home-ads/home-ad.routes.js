const express = require('express');
const HomeAdController = require('./home-ad.controller');

const router = express.Router();

router.get('/', HomeAdController.getAll);

module.exports = router;
