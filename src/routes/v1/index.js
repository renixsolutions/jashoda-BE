const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('../../app/users/user.routes');

const router = express.Router();

// API version 1 routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

module.exports = router;

