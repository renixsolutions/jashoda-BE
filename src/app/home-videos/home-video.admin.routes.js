const express = require('express');
const HomeVideoController = require('./home-video.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.post('/', HomeVideoController.create);
router.put('/:id', HomeVideoController.update);
router.delete('/:id', HomeVideoController.delete);

module.exports = router;
