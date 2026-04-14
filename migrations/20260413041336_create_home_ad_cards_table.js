/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('home_ad_cards', table => {
    table.increments('id').primary();
    table.string('title').nullable();
    table.string('subtitle').nullable();
    table.string('video_url').notNullable();
    table.string('link_url').nullable();
    table.string('link_text').nullable();
    table.integer('category_id').unsigned().references('id').inTable('categories').onDelete('SET NULL');
    table.integer('gender_id').unsigned().references('id').inTable('genders').onDelete('SET NULL');
    table.integer('occasion_id').unsigned().references('id').inTable('occasions').onDelete('SET NULL');
    table.boolean('is_active').defaultTo(true);
    table.integer('order_index').defaultTo(0);
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('home_ad_cards');
};
