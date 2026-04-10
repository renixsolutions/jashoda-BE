/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('product_review_images', function(table) {
    table.string('type', 20).notNullable().defaultTo('image'); // 'image' or 'video'
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('product_review_images', function(table) {
    table.dropColumn('type');
  });
};
