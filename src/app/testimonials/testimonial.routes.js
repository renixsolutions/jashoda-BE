const express = require('express');
const router = express.Router();
const testimonialController = require('./testimonial.controller');

router.get('/', testimonialController.getAllTestimonials);
router.get('/:id', testimonialController.getTestimonialById);

module.exports = router;
