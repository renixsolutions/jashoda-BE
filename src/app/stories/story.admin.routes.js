const express = require('express');
const StoryController = require('./story.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/', StoryController.getAll);
router.post('/', StoryController.create);
router.put('/:id', StoryController.update);
router.delete('/:id', StoryController.delete);

module.exports = router;
