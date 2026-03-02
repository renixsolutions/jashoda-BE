/**
 * Cart, Orders, Order Items, and Favorites for e-commerce
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .createTable('carts', function (table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.timestamps(true, true);
      table.unique(['user_id']);
      table.index('user_id');
    })
    .then(() =>
      knex.schema.createTable('cart_items', function (table) {
        table.increments('id').primary();
        table.integer('cart_id').unsigned().notNullable().references('id').inTable('carts').onDelete('CASCADE');
        table.integer('product_id').unsigned().notNullable().references('id').inTable('products').onDelete('CASCADE');
        table.integer('quantity').unsigned().notNullable().defaultTo(1);
        table.decimal('price', 12, 2).notNullable(); // snapshot at add-to-cart
        table.timestamps(true, true);
        table.unique(['cart_id', 'product_id']);
        table.index('cart_id');
        table.index('product_id');
      })
    )
    .then(() =>
      knex.schema.createTable('orders', function (table) {
        table.increments('id').primary();
        table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('RESTRICT');
        table.string('order_number', 50).notNullable().unique();
        table.enum('status', ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).defaultTo('pending');
        table.enum('payment_method', ['razorpay', 'cod']).notNullable();
        table.enum('payment_status', ['pending', 'paid', 'failed', 'refunded']).defaultTo('pending');
        table.string('razorpay_order_id', 255).nullable();
        table.string('razorpay_payment_id', 255).nullable();
        table.decimal('subtotal', 12, 2).notNullable();
        table.decimal('tax', 12, 2).defaultTo(0);
        table.decimal('shipping', 12, 2).defaultTo(0);
        table.decimal('discount', 12, 2).defaultTo(0);
        table.decimal('total', 12, 2).notNullable();
        table.json('shipping_address').nullable(); // { name, phone, address, city, state, pincode }
        table.timestamps(true, true);
        table.index('user_id');
        table.index('order_number');
        table.index('status');
        table.index('created_at');
      })
    )
    .then(() =>
      knex.schema.createTable('order_items', function (table) {
        table.increments('id').primary();
        table.integer('order_id').unsigned().notNullable().references('id').inTable('orders').onDelete('CASCADE');
        table.integer('product_id').unsigned().notNullable().references('id').inTable('products').onDelete('RESTRICT');
        table.integer('quantity').unsigned().notNullable();
        table.decimal('price', 12, 2).notNullable();
        table.string('product_name', 255).nullable();
        table.string('sku', 100).nullable();
        table.timestamps(true, true);
        table.index('order_id');
        table.index('product_id');
      })
    )
    .then(() =>
      knex.schema.createTable('favorites', function (table) {
        table.increments('id').primary();
        table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.integer('product_id').unsigned().notNullable().references('id').inTable('products').onDelete('CASCADE');
        table.timestamps(true, true);
        table.unique(['user_id', 'product_id']);
        table.index('user_id');
        table.index('product_id');
      })
    );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('favorites')
    .then(() => knex.schema.dropTableIfExists('order_items'))
    .then(() => knex.schema.dropTableIfExists('orders'))
    .then(() => knex.schema.dropTableIfExists('cart_items'))
    .then(() => knex.schema.dropTableIfExists('carts'));
};
