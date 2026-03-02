const express = require('express');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../../middlewares/auth.middleware');
const { sendSuccess, sendError } = require('../../utils/response');
const logger = require('../../utils/logger');

const router = express.Router();

// Protect all upload routes
router.use(authenticate);

const ensureDirSync = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const saveUploadedImage = async (file, folder) => {
  const uploadsRoot = path.join(__dirname, '../../../uploads', folder);
  ensureDirSync(uploadsRoot);

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const filename = `${timestamp}_${safeName}`;
  const savePath = path.join(uploadsRoot, filename);

  await file.mv(savePath);

  // URL that frontend can use
  const urlPath = `/uploads/${folder}/${filename}`;
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

module.exports = router;


