/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('testimonials', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.text('content').notNullable();
    table.string('image_url').nullable();
    table.integer('rating').defaultTo(5);
    table.integer('rotation').defaultTo(0);
    table.boolean('is_active').defaultTo(true);
    table.integer('order_index').defaultTo(0);
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('testimonials');
};
