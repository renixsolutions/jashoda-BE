const express = require('express');
const path = require('path');
const fs = require('fs');
const heicConvert = require('heic-convert');
const sharp = require('sharp');
const { authenticate } = require('../../middlewares/auth.middleware');
const { sendSuccess, sendError } = require('../../utils/response');
const logger = require('../../utils/logger');
const { uploadToS3 } = require('../../utils/s3.service');

const router = express.Router();

// Protect all upload routes
router.use(authenticate);

const isImage = (file) => {
  if (!file) return false;
  const ext = file.name ? path.extname(file.name).toLowerCase() : '';
  const mime = file.mimetype ? file.mimetype.toLowerCase() : '';

  if (mime.startsWith('image/') || mime.includes('heic') || mime.includes('heif')) {
    return true;
  }
  if (ext === '.heic' || ext === '.heif' || ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.webp' || ext === '.gif') {
    return true;
  }

  // Robust buffer inspection for HEIC containers or standard files sent without metadata
  if (file.data && Buffer.isBuffer(file.data) && file.data.length >= 12) {
    const ftyp = file.data.toString('ascii', 4, 8);
    if (ftyp === 'ftyp') {
      return true; // Valid media container (HEIC/HEIF/MP4)
    }
    // JPEG magic numbers
    if (file.data[0] === 0xFF && file.data[1] === 0xD8) {
      return true;
    }
    // PNG magic numbers
    if (file.data[0] === 0x89 && file.data[1] === 0x50 && file.data[2] === 0x4E && file.data[3] === 0x47) {
      return true;
    }
    // WebP magic numbers
    if (file.data.toString('ascii', 0, 4) === 'RIFF' && file.data.toString('ascii', 8, 12) === 'WEBP') {
      return true;
    }
  }

  // Safe fallback for generic binary uploads from client side
  if (mime === 'application/octet-stream' || mime === '') {
    return true;
  }

  return false;
};

const saveUploadedImage = async (file, folder) => {
  let ext = file.name ? path.extname(file.name).toLowerCase() : '';
  let isHeic = ext === '.heic' || ext === '.heif';
  const mime = file.mimetype ? file.mimetype.toLowerCase() : '';

  if (!isHeic && (mime.includes('heic') || mime.includes('heif'))) {
    isHeic = true;
  }

  // Detect via buffer magic numbers if missing explicit metadata
  if (!isHeic && file.data && Buffer.isBuffer(file.data) && file.data.length >= 12) {
    if (file.data.toString('ascii', 4, 8) === 'ftyp') {
      const brand = file.data.toString('ascii', 8, 12).trim();
      if (['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1'].includes(brand)) {
        isHeic = true;
      }
    }
  }

  if (isHeic && file.data && Buffer.isBuffer(file.data)) {
    try {
      logger.info('Converting HEIC image buffer to JPEG...');
      const outputBuffer = await heicConvert({
        buffer: file.data,
        format: 'JPEG',
        quality: 0.85
      });
      file.data = outputBuffer;
      file.mimetype = 'image/jpeg';
      const baseName = file.name ? path.basename(file.name, path.extname(file.name)) : 'image';
      file.name = baseName + '.jpg';
    } catch (conversionErr) {
      logger.error('Failed to convert HEIC to JPEG, falling back to original blob:', conversionErr);
      file.mimetype = ext === '.heif' ? 'image/heif' : 'image/heic';
      if (!ext) {
        file.name = (file.name || 'image') + '.heic';
      }
    }
  } else if ((!file.mimetype || file.mimetype === 'application/octet-stream') && file.data && Buffer.isBuffer(file.data) && file.data.length >= 2) {
    if (file.data[0] === 0xFF && file.data[1] === 0xD8) {
      file.mimetype = 'image/jpeg';
      if (!ext) file.name = (file.name || 'image') + '.jpg';
    } else if (file.data[0] === 0x89 && file.data[1] === 0x50) {
      file.mimetype = 'image/png';
      if (!ext) file.name = (file.name || 'image') + '.png';
    }
  }

  // Optimize standard images with sharp before uploading to S3
  if (file.mimetype && file.mimetype.startsWith('image/')) {
    try {
      logger.info(`Optimizing image with sharp: ${file.name} (${file.mimetype})`);
      const originalSize = file.data.length;

      let sharpInstance = sharp(file.data).rotate();

      // Get metadata to inspect width
      const metadata = await sharpInstance.metadata();
      
      // Limit resolution to maximum width 3000px (retaining details for zoom)
      if (metadata.width && metadata.width > 3000) {
        sharpInstance = sharpInstance.resize({ width: 3000, withoutEnlargement: true });
      }

      // Convert all images to WebP format for optimal quality/compression (except GIFs to preserve animation)
      const currentMime = file.mimetype.toLowerCase();
      let convertedToWebP = false;

      if (currentMime === 'image/gif') {
        // Leave GIF format, but optimize if needed
      } else {
        sharpInstance = sharpInstance.webp({ quality: 85 });
        convertedToWebP = true;
      }

      const optimizedBuffer = await sharpInstance.toBuffer();

      if (convertedToWebP) {
        file.data = optimizedBuffer;
        file.mimetype = 'image/webp';
        const baseName = file.name ? path.basename(file.name, path.extname(file.name)) : 'image';
        file.name = baseName + '.webp';
        logger.info(`Optimized & converted ${file.name} to WebP: ${(originalSize / 1024).toFixed(1)}KB -> ${(optimizedBuffer.length / 1024).toFixed(1)}KB`);
      } else {
        if (optimizedBuffer.length < originalSize) {
          file.data = optimizedBuffer;
          logger.info(`Optimized GIF ${file.name}: ${(originalSize / 1024).toFixed(1)}KB -> ${(optimizedBuffer.length / 1024).toFixed(1)}KB`);
        } else {
          logger.info(`Optimized GIF was not smaller than original. Uploading original.`);
        }
      }
    } catch (err) {
      logger.error('Sharp optimization failed, uploading original:', err);
    }
  }

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
    if (!isImage(file)) {
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
    if (!isImage(file)) {
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
    if (!isImage(file)) {
      return sendError(res, 400, 'Only image uploads are allowed');
    }

    const url = await saveUploadedImage(file, 'occasions');
    return sendSuccess(res, 200, 'Occasion image uploaded successfully', { url });
  } catch (error) {
    logger.error('Occasion image upload error:', error);
    return sendError(res, 500, 'Failed to upload occasion image');
  }
});

router.post('/collection-image', async (req, res) => {
  try {
    if (!req.files || !req.files.image) {
      return sendError(res, 400, 'Image file is required');
    }

    const file = req.files.image;
    if (!isImage(file)) {
      return sendError(res, 400, 'Only image uploads are allowed');
    }

    const url = await saveUploadedImage(file, 'collections');
    return sendSuccess(res, 200, 'Collection image uploaded successfully', { url });
  } catch (error) {
    logger.error('Collection image upload error:', error);
    return sendError(res, 500, 'Failed to upload collection image');
  }
});

// Review images (1-3 per review); authenticated users (e.g. customers) can upload when submitting a review
router.post('/review-image', async (req, res) => {
  try {
    if (!req.files || !req.files.image) {
      return sendError(res, 400, 'Image file is required');
    }

    const file = req.files.image;
    if (!isImage(file)) {
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
    
    if (file.mimetype && file.mimetype.startsWith('video/')) {
      type = 'video';
    } else if (isImage(file)) {
      type = 'image';
    } else {
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
    if (!isImage(file)) {
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
    if (!isImage(file)) {
      return sendError(res, 400, 'Only image uploads are allowed');
    }

    const url = await saveUploadedImage(file, 'testimonials');
    return sendSuccess(res, 200, 'Testimonial image uploaded successfully', { url });
  } catch (error) {
    logger.error('Testimonial image upload error:', error);
    return sendError(res, 500, 'Failed to upload testimonial image');
  }
});

// Generic media upload endpoint (supports file or image field name)
router.post('/', async (req, res) => {
  try {
    if (!req.files || (!req.files.file && !req.files.image)) {
      return sendError(res, 400, 'Media file is required');
    }

    const file = req.files.file || req.files.image;
    if (!isImage(file)) {
      return sendError(res, 400, 'Only image uploads are allowed');
    }

    const url = await saveUploadedImage(file, 'general');
    return sendSuccess(res, 200, 'Media uploaded successfully', { url });
  } catch (error) {
    logger.error('Media upload error:', error);
    return sendError(res, 500, 'Failed to upload media');
  }
});

module.exports = router;


