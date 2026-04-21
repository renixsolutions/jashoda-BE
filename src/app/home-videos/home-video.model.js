const db = require('../../db/knex');

class HomeVideo {
  static get tableName() {
    return 'home_videos';
  }

  static async findAll(activeOnly = false) {
    let query = db(this.tableName);
    if (activeOnly) {
      query = query.where({ is_active: true });
    }
    return query.orderBy('created_at', 'desc');
  }

  static async findById(id) {
    return db(this.tableName).where({ id }).first();
  }

  static async create(data) {
    // If setting a new active video, you might want to deactivate others
    // For now we just create it
    const [result] = await db(this.tableName).insert(data).returning('*');
    return result;
  }

  static async update(id, data) {
    data.updated_at = db.fn.now();
    const [result] = await db(this.tableName).where({ id }).update(data).returning('*');
    return result;
  }

  static async delete(id) {
    return db(this.tableName).where({ id }).del();
  }
}

module.exports = HomeVideo;
