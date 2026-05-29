/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('categories', function (table) {
    table.jsonb('gender_images').defaultTo('{}').nullable();
    table.jsonb('applicable_genders').defaultTo('[]').nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('categories', function (table) {
    table.dropColumn('gender_images');
    table.dropColumn('applicable_genders');
  });
};
