/**
 * User addresses table for multiple saved addresses per user
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('user_addresses', function (table) {
    table.increments('id').primary();
    table
      .integer('user_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.string('label', 100).nullable(); // Home, Office, etc.
    table.string('name', 150).nullable();
    table.string('phone', 30).nullable();
    table.string('address', 255).notNullable();
    table.string('city', 100).nullable();
    table.string('state', 100).nullable();
    table.string('pincode', 20).nullable();
    table.string('country', 100).nullable();
    table.boolean('is_default').notNullable().defaultTo(false);
    table.timestamps(true, true);
    table.index(['user_id', 'is_default']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('user_addresses');
};

