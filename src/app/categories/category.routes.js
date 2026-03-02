const express = require('express');
const CategoryController = require('./category.controller');

const router = express.Router();

// Website: Get all categories (with pagination)
router.get('/', CategoryController.list);

// Website: Get parent categories only (must be before /:id route)
router.get('/parents', CategoryController.getParents);

// Website: Get subcategories by parent ID (must be before /:id route)
router.get('/parents/:parentId/subcategories', CategoryController.getSubcategoriesByParent);

// Website: Get category by ID or slug with products (must be last)
router.get('/:id', CategoryController.getByIdWithProducts);

module.exports = router;


