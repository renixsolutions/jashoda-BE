const knex = require('../../db/knex');

class GenderModel {
  static async findAll(options = {}) {
    const { status = 'active' } = options;
    let query = knex('genders');
    if (status) {
      query = query.where({ status });
    }
    return query.orderBy('name', 'asc');
  }

  static async findBySlug(slug) {
    return knex('genders').where({ slug }).first();
  }

  static async create(data) {
    const [gender] = await knex('genders')
      .insert(data)
      .returning('*');
    return gender;
  }

  static async delete(id) {
    return knex('genders').where({ id }).del();
  }
}

module.exports = GenderModel;

