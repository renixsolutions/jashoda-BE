const db = require('../../db/knex');

class HomeAdCard {
    static get tableName() {
        return 'home_ad_cards';
    }

    static async findAll(activeOnly = false) {
        const query = db(this.tableName)
            .select(
                'home_ad_cards.*',
                'categories.slug as category_slug',
                'categories.name as category_name',
                'genders.slug as gender_slug',
                'genders.name as gender_name',
                'occasions.slug as occasion_slug',
                'occasions.name as occasion_name'
            )
            .leftJoin('categories', 'home_ad_cards.category_id', 'categories.id')
            .leftJoin('genders', 'home_ad_cards.gender_id', 'genders.id')
            .leftJoin('occasions', 'home_ad_cards.occasion_id', 'occasions.id')
            .orderBy('home_ad_cards.order_index', 'asc');

        if (activeOnly) {
            query.where('home_ad_cards.is_active', true);
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

module.exports = HomeAdCard;
