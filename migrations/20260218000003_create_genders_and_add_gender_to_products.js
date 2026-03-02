/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('genders', function (table) {
    table.increments('id').primary();
    table.string('name', 50).notNullable().unique();
    table.string('slug', 50).notNullable().unique();
    table.enum('status', ['active', 'inactive']).defaultTo('active');
    table.timestamps(true, true);
  });

  await knex.schema.alterTable('products', function (table) {
    table.string('gender', 50).nullable().index();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable('products', function (table) {
    table.dropColumn('gender');
  });
  await knex.schema.dropTableIfExists('genders');
};

