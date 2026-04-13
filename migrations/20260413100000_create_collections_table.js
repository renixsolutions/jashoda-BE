
exports.up = function(knex) {
  return knex.schema
    .createTable('collections', (table) => {
      table.increments('id').primary();
      table.string('name', 255).notNullable();
      table.string('slug', 255).notNullable().unique();
      table.text('description');
      table.string('image_url', 500);
      table.boolean('is_active').defaultTo(true);
      table.integer('sort_order').defaultTo(0);
      table.timestamps(true, true);
    })
    .createTable('product_collections', (table) => {
      table.increments('id').primary();
      table.integer('product_id').unsigned().notNullable()
        .references('id').inTable('products').onDelete('CASCADE');
      table.integer('collection_id').unsigned().notNullable()
        .references('id').inTable('collections').onDelete('CASCADE');
      table.unique(['product_id', 'collection_id']);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('product_collections')
    .dropTableIfExists('collections');
};
