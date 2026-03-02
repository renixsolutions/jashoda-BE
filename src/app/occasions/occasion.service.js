const OccasionModel = require('./occasion.model');
const messages = require('../../constants/messages');

class OccasionService {
  static async create(data) {
    const slug =
      data.slug ||
      data.name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

    const existing = await OccasionModel.findBySlug(slug);
    if (existing) {
      throw new Error('Occasion with this slug already exists');
    }

    return OccasionModel.create({ ...data, slug });
  }

  static async getById(id) {
    const occasion = await OccasionModel.findById(id);
    if (!occasion) {
      throw new Error(messages.NOT_FOUND);
    }
    return occasion;
  }

  static async getBySlug(slug) {
    const occasion = await OccasionModel.findBySlug(slug);
    if (!occasion) {
      throw new Error(messages.NOT_FOUND);
    }
    return occasion;
  }

  static async getAll(options = {}) {
    return OccasionModel.findAll(options);
  }

  static async getAllActive() {
    return OccasionModel.getAllActive();
  }

  static async update(id, data) {
    const occasion = await OccasionModel.findById(id);
    if (!occasion) {
      throw new Error(messages.NOT_FOUND);
    }

    if (data.name && !data.slug) {
      data.slug = data.name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
    }

    return OccasionModel.update(id, data);
  }

  static async delete(id) {
    const occasion = await OccasionModel.findById(id);
    if (!occasion) {
      throw new Error(messages.NOT_FOUND);
    }
    return OccasionModel.delete(id);
  }
}

module.exports = OccasionService;
