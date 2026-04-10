/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('hero_banners', (table) => {
    table.increments('id').primary();
    table.string('title').nullable();
    table.string('subtitle').nullable();
    table.string('brand_text').nullable();
    table.text('description').nullable();
    table.string('image_url').notNullable();
    table.string('cta_text').nullable().defaultTo('EXPLORE NOW');
    
    // Filters
    table.integer('category_id').unsigned().nullable();
    table.integer('subcategory_id').unsigned().nullable();
    table.integer('gender_id').unsigned().nullable();
    table.integer('occasion_id').unsigned().nullable();
    
    // Foreign Keys
    table.foreign('category_id').references('id').inTable('categories').onDelete('SET NULL');
    table.foreign('subcategory_id').references('id').inTable('categories').onDelete('SET NULL');
    table.foreign('gender_id').references('id').inTable('genders').onDelete('SET NULL');
    table.foreign('occasion_id').references('id').inTable('occasions').onDelete('SET NULL');
    
    // Styling
    table.string('bg_color').nullable();
    table.string('accent_color').nullable();
    
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
  return knex.schema.dropTableIfExists('hero_banners');
};
