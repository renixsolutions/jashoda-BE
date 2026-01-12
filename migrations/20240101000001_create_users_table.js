/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.string('email', 255).notNullable().unique();
    table.string('username', 100).notNullable().unique();
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.string('password', 255).notNullable();
    table.enum('status', ['active', 'inactive', 'suspended']).defaultTo('active');
    table.text('address').nullable();
    table.string('country', 100).nullable();
    table.string('city', 100).nullable();
    table.string('state', 100).nullable();
    table.timestamps(true, true);
    table.timestamp('deleted_at').nullable();
    
    // Indexes
    table.index('email');
    table.index('username');
    table.index('status');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('users');
};

