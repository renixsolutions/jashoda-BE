const ProductModel = require('./product.model');
const messages = require('../../constants/messages');
const { toFullUrl } = require('../../utils/helpers');
const config = require('../../config/app');

function withFullImageUrls(images) {
  if (!Array.isArray(images)) return images;
  const baseUrl = config.appUrl;
  return images.map((img) => toFullUrl(img.url, baseUrl));
}

class ProductService {
  static async create(productData) {
    const slug = productData.slug || productData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const existing = await ProductModel.findBySlug(slug);
    if (existing) {
      throw new Error('Product with this slug already exists');
    }

    const images = productData.images;
    const occasionIds = productData.occasion_ids;
    const collectionIds = productData.collection_ids;
    
    if (images) {
      if (!Array.isArray(images) || images.length < 1 || images.length > 5) {
        throw new Error('Products must have between 1 and 5 images');
      }
    }

    const [primaryImage, ...otherImages] = Array.isArray(images) ? images : [productData.image_url].filter(Boolean);
    const productToCreate = {
      ...productData,
      slug,
      image_url: primaryImage || null
    };
    delete productToCreate.images;
    delete productToCreate.occasion_ids;
    delete productToCreate.collection_ids;

    const product = await ProductModel.create(productToCreate);

    const allImages = Array.isArray(images) ? images : primaryImage ? [primaryImage, ...otherImages] : [];
    if (allImages.length) {
      await ProductModel.setImages(product.id, allImages);
    }

    if (Array.isArray(occasionIds)) {
      await ProductModel.setOccasions(product.id, occasionIds);
    }

    if (Array.isArray(collectionIds)) {
      await ProductModel.setCollections(product.id, collectionIds);
    }

    const productImages = allImages.length ? await ProductModel.getImages(product.id) : [];

    return {
      ...product,
      image_url: product.image_url ? toFullUrl(product.image_url, config.appUrl) : product.image_url,
      video_url: product.video_url ? toFullUrl(product.video_url, config.appUrl) : product.video_url,
      images: withFullImageUrls(productImages)
    };
  }

  static async getById(id) {
    const product = await ProductModel.findById(id);
    if (!product) throw new Error(messages.NOT_FOUND);

    const [images, ratingAgg] = await Promise.all([
      ProductModel.getImages(product.id),
      ProductModel.getAverageRatingAndCount(product.id)
    ]);

    return {
      ...product,
      image_url: product.image_url ? toFullUrl(product.image_url, config.appUrl) : product.image_url,
      video_url: product.video_url ? toFullUrl(product.video_url, config.appUrl) : product.video_url,
      images: withFullImageUrls(images),
      average_rating: ratingAgg.average_rating,
      review_count: ratingAgg.review_count
    };
  }

  static async getBySlug(slug) {
    const product = await ProductModel.findBySlug(slug);
    if (!product) throw new Error(messages.NOT_FOUND);

    const [images, ratingAgg] = await Promise.all([
      ProductModel.getImages(product.id),
      ProductModel.getAverageRatingAndCount(product.id)
    ]);

    return {
      ...product,
      image_url: product.image_url ? toFullUrl(product.image_url, config.appUrl) : product.image_url,
      video_url: product.video_url ? toFullUrl(product.video_url, config.appUrl) : product.video_url,
      images: withFullImageUrls(images),
      average_rating: ratingAgg.average_rating,
      review_count: ratingAgg.review_count
    };
  }

  static async hasUserPurchased(userId, productId) {
    return ProductModel.hasUserPurchasedProduct(userId, productId);
  }

  static async hasUserReviewed(userId, productId) {
    return ProductModel.hasUserReviewedProduct(userId, productId);
  }

  static async getProductReviews(productId, options = {}) {
    const product = await ProductModel.findById(productId);
    if (!product) throw new Error(messages.NOT_FOUND);
    const result = await ProductModel.getReviewsForProduct(productId, options);
    const baseUrl = config.appUrl;
    result.reviews = result.reviews.map((r) => ({
      ...r,
      media: (r.images || []).map((m) => ({
        url: m.url ? toFullUrl(m.url, baseUrl) : m.url,
        type: m.type || 'image'
      }))
    }));
    return result;
  }

  static async createReview(productId, userId, data) {
    const product = await ProductModel.findById(productId);
    if (!product) throw new Error(messages.NOT_FOUND);

    const hasPurchased = await ProductModel.hasUserPurchasedProduct(userId, productId);
    if (!hasPurchased) {
      throw new Error('You can only review products you have purchased. Please buy this product first.');
    }

    const alreadyReviewed = await ProductModel.hasUserReviewedProduct(userId, productId);
    if (alreadyReviewed) {
      throw new Error('You have already reviewed this product. Only one review per product is allowed.');
    }

    const rating = parseInt(data.rating, 10);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const media = Array.isArray(data.media) ? data.media : [];
    if (media.length > 5) {
      throw new Error('You can upload at most 5 photos or videos with your review');
    }

    const review = await ProductModel.createReview({
      product_id: productId,
      user_id: userId,
      rating,
      review_title: data.review_title || null,
      review_description: data.review_description || null,
      is_verified_purchase: true
    });

    if (media.length > 0) {
      await ProductModel.setReviewImages(review.review_id, media);
    }

    const reviewMedia = await ProductModel.getReviewImagesByReviewIds([review.review_id]);
    const baseUrl = config.appUrl;
    const reviewWithMedia = {
      ...review,
      media: reviewMedia.map((m) => ({
        url: m.url ? toFullUrl(m.url, baseUrl) : m.url,
        type: m.type || 'image'
      }))
    };
    return reviewWithMedia;
  }

  static async getAllReviews(options = {}) {
    const result = await ProductModel.getAllReviews(options);
    const baseUrl = config.appUrl;
    result.reviews = result.reviews.map((r) => ({
      ...r,
      media: (r.media || []).map((m) => ({
        ...m,
        url: m.url ? toFullUrl(m.url, baseUrl) : m.url
      }))
    }));
    return result;
  }

  static async updateReview(reviewId, data) {
    return ProductModel.updateReview(reviewId, data);
  }

  static async deleteReview(reviewId) {
    return ProductModel.deleteReview(reviewId);
  }

  static async getAll(options = {}) {
    const result = await ProductModel.findAll(options);

    // Include images for all products (with full URLs)
    const baseUrl = config.appUrl;
    const productsWithImages = await Promise.all(
      result.products.map(async (product) => {
        const images = await ProductModel.getImages(product.id);
        return {
          ...product,
          image_url: product.image_url ? toFullUrl(product.image_url, baseUrl) : product.image_url,
          images: withFullImageUrls(images)
        };
      })
    );

    return {
      products: productsWithImages,
      pagination: result.pagination
    };
  }

  static async update(id, productData) {
    const product = await ProductModel.findById(id);
    if (!product) throw new Error(messages.NOT_FOUND);

    const images = productData.images;
    const occasionIds = productData.occasion_ids;
    const collectionIds = productData.collection_ids;
    
    if (images) {
      if (!Array.isArray(images) || images.length < 1 || images.length > 5) {
        throw new Error('Products must have between 1 and 5 images');
      }
    }

    // Do not attempt to update a non-existent `images` column on products.
    // Images are stored in the separate product_images table.
    const dataWithoutImages = { ...productData };
    delete dataWithoutImages.images;
    delete dataWithoutImages.occasion_ids;
    delete dataWithoutImages.collection_ids;

    const updatedProduct = await ProductModel.update(id, dataWithoutImages);

    if (Array.isArray(images)) {
      await ProductModel.replaceImages(id, images);
    }

    if (Array.isArray(occasionIds)) {
      await ProductModel.setOccasions(id, occasionIds);
    }

    if (Array.isArray(collectionIds)) {
      await ProductModel.setCollections(id, collectionIds);
    }

    const productImages = await ProductModel.getImages(id);

    return {
      ...updatedProduct,
      image_url: updatedProduct.image_url ? toFullUrl(updatedProduct.image_url, config.appUrl) : updatedProduct.image_url,
      video_url: updatedProduct.video_url ? toFullUrl(updatedProduct.video_url, config.appUrl) : updatedProduct.video_url,
      images: withFullImageUrls(productImages)
    };
  }

  static async delete(id) {
    const product = await ProductModel.findById(id);
    if (!product) throw new Error(messages.NOT_FOUND);
    await ProductModel.delete(id);
    return true;
  }
}

module.exports = ProductService;
