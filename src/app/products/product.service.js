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

    const product = await ProductModel.create(productToCreate);

    const allImages = Array.isArray(images) ? images : primaryImage ? [primaryImage, ...otherImages] : [];
    if (allImages.length) {
      await ProductModel.setImages(product.id, allImages);
    }

    const productImages = allImages.length ? await ProductModel.getImages(product.id) : [];

    return {
      ...product,
      image_url: product.image_url ? toFullUrl(product.image_url, config.appUrl) : product.image_url,
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
      images: withFullImageUrls(images),
      average_rating: ratingAgg.average_rating,
      review_count: ratingAgg.review_count
    };
  }

  static async getProductReviews(productId, options = {}) {
    const product = await ProductModel.findById(productId);
    if (!product) throw new Error(messages.NOT_FOUND);
    const result = await ProductModel.getReviewsForProduct(productId, options);
    const baseUrl = config.appUrl;
    result.reviews = result.reviews.map((r) => ({
      ...r,
      images: (r.images || []).map((img) => img.url ? toFullUrl(img.url, baseUrl) : img.url)
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

    const images = Array.isArray(data.images) ? data.images : [];
    if (images.length > 3) {
      throw new Error('You can upload at most 3 images with your review');
    }

    const review = await ProductModel.createReview({
      product_id: productId,
      user_id: userId,
      rating,
      review_title: data.review_title || null,
      review_description: data.review_description || null,
      is_verified_purchase: true
    });

    if (images.length > 0) {
      const urls = images.map((i) => (typeof i === 'string' ? i : i.url || i));
      await ProductModel.setReviewImages(review.review_id, urls);
    }

    const reviewImages = await ProductModel.getReviewImagesByReviewIds([review.review_id]);
    const baseUrl = config.appUrl;
    const reviewWithImages = {
      ...review,
      images: reviewImages.map((img) => img.url ? toFullUrl(img.url, baseUrl) : img.url)
    };
    return reviewWithImages;
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
    if (images) {
      if (!Array.isArray(images) || images.length < 1 || images.length > 5) {
        throw new Error('Products must have between 1 and 5 images');
      }
    }

    // Do not attempt to update a non-existent `images` column on products.
    // Images are stored in the separate product_images table.
    const dataWithoutImages = { ...productData };
    delete dataWithoutImages.images;

    const updatedProduct = await ProductModel.update(id, dataWithoutImages);

    if (Array.isArray(images)) {
      await ProductModel.replaceImages(id, images);
    }

    const productImages = await ProductModel.getImages(id);

    return {
      ...updatedProduct,
      image_url: updatedProduct.image_url ? toFullUrl(updatedProduct.image_url, config.appUrl) : updatedProduct.image_url,
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
