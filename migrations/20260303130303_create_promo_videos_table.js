/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable('promo_videos', (table) => {
        table.increments('id').primary();
        table.string('title').nullable();
        table.string('subtitle').nullable();
        table.string('video_url').notNullable(); // The uploaded video src
        table.string('link_url').nullable(); // Explore now link
        table.boolean('is_active').defaultTo(true);
        table.integer('order_index').defaultTo(0);
        table.timestamps(true, true);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTableIfExists('promo_videos');
};
