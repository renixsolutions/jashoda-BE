/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('product_reviews', function(table) {
    // Adding a JSONB column to store an array of media objects: [{ type: 'image'|'video', url: '...' }]
    table.jsonb('media').nullable().defaultTo(JSON.stringify([]));
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('product_reviews', function(table) {
    table.dropColumn('media');
  });
};
