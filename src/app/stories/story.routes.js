const express = require('express');
const StoryController = require('./story.controller');

const router = express.Router();

// Public route to get stories
router.get('/', StoryController.getAll);

module.exports = router;
