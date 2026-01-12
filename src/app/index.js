const express = require('express');
const userRoutes = require('./users/user.routes');
const authRoutes = require('./auth/auth.routes');

const router = express.Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

module.exports = router;

