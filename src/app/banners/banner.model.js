const db = require('../../db/knex');

class Banner {
    static get tableName() {
        return 'hero_banners';
    }

    static async findAll(activeOnly = false, type = null) {
        const query = db(this.tableName).orderBy('order_index', 'asc');
        if (activeOnly) {
            query.where('is_active', true);
        }
        if (type) {
            query.where('banner_type', type);
        }
        return query;
    }

    static async findById(id) {
        return db(this.tableName).where({ id }).first();
    }

    static async create(data) {
        const [result] = await db(this.tableName).insert(data).returning('*');
        return result;
    }

    static async update(id, data) {
        const [result] = await db(this.tableName)
            .where({ id })
            .update(data)
            .returning('*');
        return result;
    }

    static async delete(id) {
        return db(this.tableName).where({ id }).del();
    }
}

module.exports = Banner;
