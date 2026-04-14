/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable('product_occasions', table => {
    table.increments('id').primary();
    table.integer('product_id').unsigned().notNullable()
      .references('id').inTable('products').onDelete('CASCADE');
    table.integer('occasion_id').unsigned().notNullable()
      .references('id').inTable('occasions').onDelete('CASCADE');
    table.unique(['product_id', 'occasion_id']);
    table.timestamps(true, true);
  });

  // Migrate existing occasion_id from products table to product_occasions
  const products = await knex('products').select('id', 'occasion_id').whereNotNull('occasion_id');
  if (products.length > 0) {
    const productOccasions = products.map(p => ({
      product_id: p.id,
      occasion_id: p.occasion_id
    }));
    await knex('product_occasions').insert(productOccasions);
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('product_occasions');
};
