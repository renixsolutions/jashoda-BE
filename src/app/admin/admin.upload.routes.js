const express = require('express');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../../middlewares/auth.middleware');
const { sendSuccess, sendError } = require('../../utils/response');
const logger = require('../../utils/logger');
const { uploadToS3 } = require('../../utils/s3.service');

const router = express.Router();

// Protect all upload routes
router.use(authenticate);

const saveUploadedImage = async (file, folder) => {
  // Use S3 service instead of local file system
  const urlPath = await uploadToS3(file, folder);
  return urlPath;
};

router.post('/product-image', async (req, res) => {
  try {
    if (!req.files || !req.files.image) {
      return sendError(res, 400, 'Image file is required');
    }

    const file = req.files.image;
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return sendError(res, 400, 'Only image uploads are allowed');
    }

    const url = await saveUploadedImage(file, 'products');
    return sendSuccess(res, 200, 'Product image uploaded successfully', { url });
  } catch (error) {
    logger.error('Product image upload error:', error);
    return sendError(res, 500, 'Failed to upload product image');
  }
});

router.post('/category-image', async (req, res) => {
  try {
    if (!req.files || !req.files.image) {
      return sendError(res, 400, 'Image file is required');
    }

    const file = req.files.image;
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return sendError(res, 400, 'Only image uploads are allowed');
    }

    const url = await saveUploadedImage(file, 'categories');
    return sendSuccess(res, 200, 'Category image uploaded successfully', { url });
  } catch (error) {
    logger.error('Category image upload error:', error);
    return sendError(res, 500, 'Failed to upload category image');
  }
});

router.post('/occasion-image', async (req, res) => {
  try {
    if (!req.files || !req.files.image) {
      return sendError(res, 400, 'Image file is required');
    }

    const file = req.files.image;
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return sendError(res, 400, 'Only image uploads are allowed');
    }

    const url = await saveUploadedImage(file, 'occasions');
    return sendSuccess(res, 200, 'Occasion image uploaded successfully', { url });
  } catch (error) {
    logger.error('Occasion image upload error:', error);
    return sendError(res, 500, 'Failed to upload occasion image');
  }
});

// Review images (1-3 per review); authenticated users (e.g. customers) can upload when submitting a review
router.post('/review-image', async (req, res) => {
  try {
    if (!req.files || !req.files.image) {
      return sendError(res, 400, 'Image file is required');
    }

    const file = req.files.image;
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return sendError(res, 400, 'Only image uploads are allowed');
    }

    const url = await saveUploadedImage(file, 'reviews');
    return sendSuccess(res, 200, 'Review image uploaded successfully', { url });
  } catch (error) {
    logger.error('Review image upload error:', error);
    return sendError(res, 500, 'Failed to upload review image');
  }
});

// Review media (images/videos); supports multiple formats
router.post('/review-media', async (req, res) => {
  try {
    if (!req.files || !req.files.media) {
      return sendError(res, 400, 'Media file is required');
    }

    const file = req.files.media;
    let type = 'image';
    
    if (file.mimetype.startsWith('video/')) {
      type = 'video';
    } else if (!file.mimetype.startsWith('image/')) {
      return sendError(res, 400, 'Only image and video uploads are allowed');
    }

    const url = await saveUploadedImage(file, 'reviews');
    return sendSuccess(res, 200, 'Review media uploaded successfully', { url, type });
  } catch (error) {
    logger.error('Review media upload error:', error);
    return sendError(res, 500, 'Failed to upload review media');
  }
});

// Promo videos
router.post('/promo-video', async (req, res) => {
  try {
    if (!req.files || !req.files.video) {
      return sendError(res, 400, 'Video file is required');
    }

    const file = req.files.video;
    if (!file.mimetype || !file.mimetype.startsWith('video/')) {
      return sendError(res, 400, 'Only video uploads are allowed');
    }

    const url = await saveUploadedImage(file, 'promos');
    return sendSuccess(res, 200, 'Promo video uploaded successfully', { url });
  } catch (error) {
    logger.error('Promo video upload error:', error);
    return sendError(res, 500, 'Failed to upload promo video');
  }
});

// Home ad videos
router.post('/home-ad-video', async (req, res) => {
  try {
    if (!req.files || !req.files.video) {
      return sendError(res, 400, 'Video file is required');
    }

    const file = req.files.video;
    if (!file.mimetype || !file.mimetype.startsWith('video/')) {
      return sendError(res, 400, 'Only video uploads are allowed');
    }

    const url = await saveUploadedImage(file, 'home-ads');
    return sendSuccess(res, 200, 'Home ad video uploaded successfully', { url });
  } catch (error) {
    logger.error('Home ad video upload error:', error);
    return sendError(res, 500, 'Failed to upload home ad video');
  }
});
router.post('/story-video', async (req, res) => {
  try {
    if (!req.files || !req.files.video) {
      return sendError(res, 400, 'Video file is required');
    }

    const file = req.files.video;
    if (!file.mimetype || !file.mimetype.startsWith('video/')) {
      return sendError(res, 400, 'Only video uploads are allowed');
    }

    const url = await saveUploadedImage(file, 'stories');
    return sendSuccess(res, 200, 'Story video uploaded successfully', { url });
  } catch (error) {
    logger.error('Story video upload error:', error);
    return sendError(res, 500, 'Failed to upload story video');
  }
});

// Banner images
router.post('/banner-image', async (req, res) => {
  try {
    if (!req.files || !req.files.image) {
      return sendError(res, 400, 'Image file is required');
    }

    const file = req.files.image;
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return sendError(res, 400, 'Only image uploads are allowed');
    }

    const url = await saveUploadedImage(file, 'banners');
    return sendSuccess(res, 200, 'Banner image uploaded successfully', { url });
  } catch (error) {
    logger.error('Banner image upload error:', error);
    return sendError(res, 500, 'Failed to upload banner image');
  }
});

router.post('/testimonial-image', async (req, res) => {
  try {
    if (!req.files || !req.files.image) {
      return sendError(res, 400, 'Image file is required');
    }

    const file = req.files.image;
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return sendError(res, 400, 'Only image uploads are allowed');
    }

    const url = await saveUploadedImage(file, 'testimonials');
    return sendSuccess(res, 200, 'Testimonial image uploaded successfully', { url });
  } catch (error) {
    logger.error('Testimonial image upload error:', error);
    return sendError(res, 500, 'Failed to upload testimonial image');
  }
});

module.exports = router;


