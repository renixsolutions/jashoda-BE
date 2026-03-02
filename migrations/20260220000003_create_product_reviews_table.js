/**
 * Product Reviews & Ratings
 * - Users can rate products (1–5 stars).
 * - One review per user per product (enforced by unique constraint).
 * - Review allowed only if user has purchased the product (order status = 'delivered');
 *   enforce this in application logic before insert; set is_verified_purchase accordingly.
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('product_reviews', function (table) {
    table.increments('review_id').primary();
    table.integer('product_id').unsigned().notNullable().references('id').inTable('products').onDelete('CASCADE');
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');

    table.smallint('rating').unsigned().notNullable(); // 1–5
    table.string('review_title', 255).nullable();
    table.text('review_description').nullable();
    table.boolean('is_verified_purchase').notNullable().defaultTo(false);
    table.integer('helpful_count').unsigned().notNullable().defaultTo(0);
    table.enum('status', ['pending', 'approved', 'rejected']).notNullable().defaultTo('pending');

    table.timestamps(true, true);

    // One review per user per product
    table.unique(['user_id', 'product_id']);

    // Query patterns: by product, by user, by status, recent
    table.index('product_id');
    table.index('user_id');
    table.index('status');
    table.index('rating');
    table.index('created_at');
    table.index(['product_id', 'status']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('product_reviews');
};
