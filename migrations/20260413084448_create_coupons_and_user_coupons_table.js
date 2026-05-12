/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('coupons', (table) => {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.string('code').notNullable().unique();
    table.text('description');
    table.enum('discount_type', ['PERCENTAGE', 'FIXED']).notNullable().defaultTo('PERCENTAGE');
    table.decimal('discount_value', 10, 2).notNullable();
    table.decimal('min_purchase', 10, 2).defaultTo(0);
    table.decimal('max_discount', 10, 2).defaultTo(0);
    table.dateTime('expiry_date').notNullable();
    table.boolean('is_active').defaultTo(true);
    table.integer('usage_limit').defaultTo(0);
    table.integer('usage_count').defaultTo(0);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('coupons');
};

