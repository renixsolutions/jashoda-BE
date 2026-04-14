const express = require('express');
const router = express.Router();
const marqueeController = require('./marquee.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

// Apply auth to all admin routes
router.use(authenticate);

router.get('/', marqueeController.getAllMessages);
router.post('/messages', marqueeController.createMessage);
router.put('/messages/:id', marqueeController.updateMessage);
router.delete('/messages/:id', marqueeController.deleteMessage);
router.put('/settings', marqueeController.updateSettings);

module.exports = router;
