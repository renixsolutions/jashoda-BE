/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('categories', function (table) {
    table.integer('parent_id').unsigned().nullable();
    table.foreign('parent_id').references('id').inTable('categories').onDelete('CASCADE');
    table.index('parent_id');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('categories', function (table) {
    table.dropForeign('parent_id');
    table.dropIndex('parent_id');
    table.dropColumn('parent_id');
  });
};

