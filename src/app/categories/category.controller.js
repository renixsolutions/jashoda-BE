const CategoryService = require('./category.service');
const { sendSuccess, sendError } = require('../../utils/response');
const messages = require('../../constants/messages');
const logger = require('../../utils/logger');

class CategoryController {
  // Public list for website
  static async list(req, res) {
    try {
      const { page, limit, status, search, sortBy, sortOrder, parentId } = req.query;
      const result = await CategoryService.getAll({
        page,
        limit,
        status: status || 'active',
        search,
        sortBy,
        sortOrder,
        parentId
      });
      return sendSuccess(res, 200, 'Categories fetched successfully', result.categories, {
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('List categories error:', error);
      return sendError(res, 500, error.message || messages.ERROR);
    }
  }

  // Admin: get single
  static async getById(req, res) {
    try {
      const category = await CategoryService.getById(req.params.id);
      return sendSuccess(res, 200, 'Category fetched successfully', category);
    } catch (error) {
      logger.error('Get category error:', error);
      if (error.message === messages.NOT_FOUND) {
        return sendError(res, 404, error.message);
      }
      return sendError(res, 500, error.message || messages.ERROR);
    }
  }

  // Admin: create
  static async create(req, res) {
    try {
      const category = await CategoryService.create(req.body);
      return sendSuccess(res, 201, 'Category created successfully', category);
    } catch (error) {
      logger.error('Create category error:', error);
      return sendError(res, 400, error.message || messages.ERROR);
    }
  }

  // Admin: update
  static async update(req, res) {
    try {
      const category = await CategoryService.update(req.params.id, req.body);
      return sendSuccess(res, 200, 'Category updated successfully', category);
    } catch (error) {
      logger.error('Update category error:', error);
      if (error.message === messages.NOT_FOUND) {
        return sendError(res, 404, error.message);
      }
      return sendError(res, 400, error.message || messages.ERROR);
    }
  }

  // Admin: delete
  static async remove(req, res) {
    try {
      await CategoryService.delete(req.params.id);
      return sendSuccess(res, 200, 'Category deleted successfully');
    } catch (error) {
      logger.error('Delete category error:', error);
      if (error.message === messages.NOT_FOUND) {
        return sendError(res, 404, error.message);
      }
      return sendError(res, 400, error.message || messages.ERROR);
    }
  }

  // Admin: get parent categories
  static async getParents(req, res) {
    try {
      const categories = await CategoryService.getParentCategories();
      return sendSuccess(res, 200, 'Parent categories fetched successfully', categories);
    } catch (error) {
      logger.error('Get parent categories error:', error);
      return sendError(res, 500, error.message || messages.ERROR);
    }
  }

  // Admin: get subcategories
  static async getSubcategories(req, res) {
    try {
      const { parentId } = req.params;
      const subcategories = await CategoryService.getSubcategories(parentId);
      return sendSuccess(res, 200, 'Subcategories fetched successfully', subcategories);
    } catch (error) {
      logger.error('Get subcategories error:', error);
      return sendError(res, 500, error.message || messages.ERROR);
    }
  }

  // Website: Get parent categories (public)
  static async getParents(req, res) {
    try {
      const categories = await CategoryService.getParentCategories();
      return sendSuccess(res, 200, 'Parent categories fetched successfully', categories);
    } catch (error) {
      logger.error('Get parent categories error:', error);
      return sendError(res, 500, error.message || messages.ERROR);
    }
  }

  // Website: Get subcategories by parent ID (public)
  static async getSubcategoriesByParent(req, res) {
    try {
      const { parentId } = req.params;
      const subcategories = await CategoryService.getSubcategories(parentId);
      return sendSuccess(res, 200, 'Subcategories fetched successfully', subcategories);
    } catch (error) {
      logger.error('Get subcategories error:', error);
      return sendError(res, 500, error.message || messages.ERROR);
    }
  }

  // Website: Get category by ID or slug with products
  static async getByIdWithProducts(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query;

      // Get category by ID or slug
      let category;
      if (!isNaN(id)) {
        category = await CategoryService.getById(parseInt(id));
      } else {
        category = await CategoryService.getBySlug(id);
      }

      if (!category) {
        return sendError(res, 404, messages.NOT_FOUND);
      }

      // Get products in this category
      const ProductService = require('../products/product.service');
      const productsResult = await ProductService.getAll({
        page: parseInt(page),
        limit: parseInt(limit),
        category: category.name,
        status: 'active'
      });

      return sendSuccess(res, 200, 'Category with products fetched successfully', {
        category,
        products: productsResult.products,
        pagination: productsResult.pagination
      });
    } catch (error) {
      logger.error('Get category with products error:', error);
      if (error.message === messages.NOT_FOUND) {
        return sendError(res, 404, error.message);
      }
      return sendError(res, 500, error.message || messages.ERROR);
    }
  }
}


module.exports = CategoryController;
