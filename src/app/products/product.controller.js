const ProductService = require('./product.service');
const FavoriteService = require('../favorites/favorite.service');
const CategoryModel = require('../categories/category.model');
const OccasionModel = require('../occasions/occasion.model');
const GenderModel = require('../genders/gender.model');
const { sendSuccess, sendError } = require('../../utils/response');
const messages = require('../../constants/messages');
const logger = require('../../utils/logger');

class ProductController {
  // Website: Product listing with filters
  static async list(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        category,
        subcategory,
        categoryId,
        subcategoryId,
        occasion,
        occasionId,
        gender,
        search,
        sortBy = 'created_at',
        sortOrder = 'desc',
        minPrice,
        maxPrice,
        metalType,
        stoneType,
        inStock
      } = req.query;

      const userId = req.user ? req.user.id : null;

      let finalCategory = category || categoryId;
      if (finalCategory && isNaN(parseInt(finalCategory, 10))) {
        const catDoc = await CategoryModel.findBySlug(finalCategory);
        if (catDoc) finalCategory = catDoc.id.toString();
      }

      let finalSubcategory = subcategory || subcategoryId;
      if (finalSubcategory && isNaN(parseInt(finalSubcategory, 10))) {
        const subcatDoc = await CategoryModel.findBySlug(finalSubcategory);
        if (subcatDoc) finalSubcategory = subcatDoc.id.toString();
      }

      let finalOccasion = occasion || occasionId;
      if (finalOccasion && isNaN(parseInt(finalOccasion, 10))) {
        const occDoc = await OccasionModel.findBySlug(finalOccasion);
        if (occDoc) finalOccasion = occDoc.id.toString();
      }

      let finalGender = gender;
      if (finalGender && isNaN(parseInt(finalGender, 10))) {
        const genDoc = await GenderModel.findBySlug(finalGender);
        if (genDoc) finalGender = genDoc.id.toString();
      }

      const result = await ProductService.getAll({
        page: parseInt(page),
        limit: parseInt(limit),
        category: finalCategory,
        subcategory: finalSubcategory,
        occasion: finalOccasion,
        gender: finalGender || undefined,
        search,
        sortBy,
        sortOrder: sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc',
        minPrice: minPrice ? parseFloat(minPrice) : null,
        maxPrice: maxPrice ? parseFloat(maxPrice) : null,
        metalType,
        stoneType,
        inStock: inStock === 'true' || inStock === true
      });

      let products = result.products;
      if (userId) {
        const favoriteIds = await FavoriteService.getFavoriteProductIds(userId);
        const set = new Set(favoriteIds);
        products = products.map((p) => ({ ...p, is_favorite: set.has(p.id) }));
      }

      return sendSuccess(res, 200, 'Products fetched successfully', products, {
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('List products error:', error);
      return sendError(res, 500, error.message || messages.ERROR);
    }
  }

  // Website: Submit a review (authenticated; only if purchased and not already reviewed)
  static async createReview(req, res) {
    try {
      const productId = parseInt(req.params.id, 10);
      if (isNaN(productId)) {
        return sendError(res, 400, 'Invalid product ID');
      }
      if (!req.user || !req.user.id) {
        return sendError(res, 401, 'You must be logged in to submit a review');
      }
      const review = await ProductService.createReview(productId, req.user.id, req.body);
      return sendSuccess(res, 201, 'Review submitted successfully. It may be visible after approval.', review);
    } catch (error) {
      logger.error('Create review error:', error);
      if (error.message === messages.NOT_FOUND) {
        return sendError(res, 404, error.message);
      }
      if (error.message.includes('only review products you have purchased')) {
        return sendError(res, 403, error.message);
      }
      if (error.message.includes('already reviewed')) {
        return sendError(res, 409, error.message);
      }
      if (error.message.includes('Rating must be')) {
        return sendError(res, 400, error.message);
      }
      return sendError(res, 500, error.message || messages.ERROR);
    }
  }

  // Website: Get product reviews (approved only) with avg rating
  static async getReviews(req, res) {
    try {
      const productId = parseInt(req.params.id, 10);
      if (isNaN(productId)) {
        return sendError(res, 400, 'Invalid product ID');
      }
      const { page = 1, limit = 10 } = req.query;
      const result = await ProductService.getProductReviews(productId, {
        page: parseInt(page, 10),
        limit: Math.min(parseInt(limit, 10) || 10, 50)
      });
      return sendSuccess(res, 200, 'Reviews fetched successfully', {
        reviews: result.reviews,
        average_rating: result.average_rating,
        review_count: result.review_count,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Get product reviews error:', error);
      if (error.message === messages.NOT_FOUND) {
        return sendError(res, 404, error.message);
      }
      return sendError(res, 500, error.message || messages.ERROR);
    }
  }

  // Website: Get product by ID or slug
  static async getById(req, res) {
    try {
      const { id } = req.params;
      // Try to get by ID first, then by slug
      let product;
      if (!isNaN(id)) {
        product = await ProductService.getById(parseInt(id));
      } else {
        product = await ProductService.getBySlug(id);
      }

      if (!product) {
        return sendError(res, 404, messages.NOT_FOUND);
      }

      const userId = req.user ? req.user.id : null;
      if (userId) {
        product.is_favorite = await FavoriteService.isFavorite(userId, product.id);
      }

      return sendSuccess(res, 200, 'Product fetched successfully', product);
    } catch (error) {
      logger.error('Get product error:', error);
      if (error.message === messages.NOT_FOUND) {
        return sendError(res, 404, error.message);
      }
      return sendError(res, 500, error.message || messages.ERROR);
    }
  }

  // Admin: create product with images
  static async create(req, res) {
    try {
      const product = await ProductService.create(req.body);
      return sendSuccess(res, 201, 'Product created successfully', product);
    } catch (error) {
      logger.error('Create product error:', error);
      return sendError(res, 400, error.message || messages.ERROR);
    }
  }

  // Admin: update product and images
  static async update(req, res) {
    try {
      const product = await ProductService.update(req.params.id, req.body);
      return sendSuccess(res, 200, 'Product updated successfully', product);
    } catch (error) {
      logger.error('Update product error:', error);
      if (error.message === messages.NOT_FOUND) {
        return sendError(res, 404, error.message);
      }
      return sendError(res, 400, error.message || messages.ERROR);
    }
  }

  // Admin: delete product
  static async remove(req, res) {
    try {
      await ProductService.delete(req.params.id);
      return sendSuccess(res, 200, 'Product deleted successfully');
    } catch (error) {
      logger.error('Delete product error:', error);
      if (error.message === messages.NOT_FOUND) {
        return sendError(res, 404, error.message);
      }
      return sendError(res, 400, error.message || messages.ERROR);
    }
  }
}

module.exports = ProductController;
