const express = require('express');
const HomeVideoController = require('./home-video.controller');

const router = express.Router();

router.get('/', HomeVideoController.getAll);
router.get('/active', HomeVideoController.getActive);
router.get('/:id', HomeVideoController.getById);

module.exports = router;
