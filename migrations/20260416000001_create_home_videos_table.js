/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('home_videos', (table) => {
    table.increments('id').primary();
    table.string('top_text').nullable();
    table.string('title').nullable();
    table.string('subtitle').nullable();
    table.text('bottom_text').nullable();
    table.string('video_url').notNullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('home_videos');
};
