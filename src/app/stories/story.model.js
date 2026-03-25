const db = require('../../db/knex');

class Story {
    static get tableName() {
        return 'stories';
    }

    static async findAll(activeOnly = false) {
        const query = db(this.tableName).orderBy('order_index', 'asc');
        if (activeOnly) {
            query.where('is_active', true);
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

module.exports = Story;
