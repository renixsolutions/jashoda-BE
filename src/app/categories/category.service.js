const CategoryModel = require('./category.model');
const messages = require('../../constants/messages');

class CategoryService {
  static async create(data) {
    const slug =
      data.slug ||
      data.name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

    const existing = await CategoryModel.findBySlug(slug);
    if (existing) {
      throw new Error('Category with this slug already exists');
    }

    return CategoryModel.create({ ...data, slug });
  }

  static async getById(id) {
    const category = await CategoryModel.findById(id);
    if (!category) {
      throw new Error(messages.NOT_FOUND);
    }
    return category;
  }

  static async getBySlug(slug) {
    const category = await CategoryModel.findBySlug(slug);
    if (!category) {
      throw new Error(messages.NOT_FOUND);
    }
    return category;
  }

  static async getAll(options = {}) {
    return CategoryModel.findAll(options);
  }

  static async update(id, data) {
    const category = await CategoryModel.findById(id);
    if (!category) {
      throw new Error(messages.NOT_FOUND);
    }

    if (data.name && !data.slug) {
      data.slug = data.name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
    }

    return CategoryModel.update(id, data);
  }

  static async delete(id) {
    const category = await CategoryModel.findById(id);
    if (!category) {
      throw new Error(messages.NOT_FOUND);
    }
    await CategoryModel.delete(id);
    return true;
  }

  static async getParentCategories() {
    return CategoryModel.getParentCategories();
  }

  static async getSubcategories(parentId) {
    return CategoryModel.getSubcategories(parentId);
  }
}

module.exports = CategoryService;


