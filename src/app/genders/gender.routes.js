const express = require('express');
const GenderController = require('./gender.controller');

const router = express.Router();

// Website: list active genders (no auth) for filters
router.get('/', (req, res, next) => {
  req.query = { ...req.query, status: 'active' };
  return GenderController.list(req, res, next);
});

module.exports = router;
