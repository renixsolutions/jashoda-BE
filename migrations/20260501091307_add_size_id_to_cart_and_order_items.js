/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .alterTable('cart_items', function(table) {
      table.integer('size_id').unsigned().nullable().references('id').inTable('ring_sizes').onDelete('SET NULL');
      // Drop old unique constraint and add new one
      table.dropUnique(['cart_id', 'product_id']);
      table.unique(['cart_id', 'product_id', 'size_id']);
    })
    .alterTable('order_items', function(table) {
      table.integer('size_id').unsigned().nullable().references('id').inTable('ring_sizes').onDelete('SET NULL');
      table.string('size_label', 50).nullable(); // size name/label for historical record
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .alterTable('cart_items', function(table) {
      table.dropUnique(['cart_id', 'product_id', 'size_id']);
      table.dropColumn('size_id');
      table.unique(['cart_id', 'product_id']);
    })
    .alterTable('order_items', function(table) {
      table.dropColumn('size_id');
      table.dropColumn('size_label');
    });
};
