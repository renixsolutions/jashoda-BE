/**
 * Images for product reviews (1-3 per review)
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('product_review_images', function (table) {
    table.increments('id').primary();
    table.integer('review_id').unsigned().notNullable().references('review_id').inTable('product_reviews').onDelete('CASCADE');
    table.string('url', 500).notNullable();
    table.smallint('sort_order').unsigned().notNullable().defaultTo(0);
    table.timestamps(true, true);
    table.index('review_id');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('product_review_images');
};
