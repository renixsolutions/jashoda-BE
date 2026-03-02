/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('categories', function (table) {
    table.increments('id').primary();
    table.string('name', 255).notNullable().unique();
    table.string('slug', 255).notNullable().unique();
    table.text('description').nullable();
    table.enum('status', ['active', 'inactive']).defaultTo('active');
    table.timestamps(true, true);

    table.index('status');
    table.index('slug');
    table.index('name');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('categories');
};


