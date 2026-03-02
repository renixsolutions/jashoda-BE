const GenderModel = require('./gender.model');
const messages = require('../../constants/messages');

class GenderService {
  static async getAll(options = {}) {
    return GenderModel.findAll(options);
  }

  static async create(data) {
    if (!data.name) {
      throw new Error(messages.NAME_REQUIRED || 'Name is required');
    }

    const slug = data.slug ||
      data.name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

    const genderToCreate = {
      name: data.name.trim(),
      slug,
      status: data.status || 'active'
    };

    return GenderModel.create(genderToCreate);
  }

  static async delete(id) {
    const deleted = await GenderModel.delete(id);
    if (!deleted) {
      throw new Error(messages.NOT_FOUND);
    }
    return true;
  }
}

module.exports = GenderService;

