/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('products', function (table) {
    table.integer('occasion_id').unsigned().nullable();
    table.foreign('occasion_id').references('id').inTable('occasions').onDelete('SET NULL');
    table.index('occasion_id');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('products', function (table) {
    table.dropForeign('occasion_id');
    table.dropIndex('occasion_id');
    table.dropColumn('occasion_id');
  });
};
