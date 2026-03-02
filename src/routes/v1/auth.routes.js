const express = require('express');
const authRoutes = require('../../app/auth/auth.routes');

const router = express.Router();

router.use('/', authRoutes);

module.exports = router;

