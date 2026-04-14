const knex = require('../../db/knex');

class Marquee {
    static async getMessages() {
        return knex('marquee_messages')
            .where('is_active', true)
            .orderBy('display_order', 'asc');
    }

    static async getAllMessages() {
        return knex('marquee_messages')
            .orderBy('display_order', 'asc');
    }

    static async getSettings() {
        return knex('marquee_settings')
            .first();
    }

    static async updateMessage(id, data) {
        return knex('marquee_messages')
            .where({ id })
            .update(data);
    }

    static async createMessage(data) {
        return knex('marquee_messages')
            .insert(data);
    }

    static async deleteMessage(id) {
        return knex('marquee_messages')
            .where({ id })
            .delete();
    }

    static async updateSettings(data) {
        return knex('marquee_settings')
            .where({ id: 1 })
            .update(data);
    }
}

module.exports = Marquee;
