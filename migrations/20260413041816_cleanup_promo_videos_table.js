/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table('promo_videos', table => {
    table.dropColumn('category_id');
    table.dropColumn('gender_id');
    table.dropColumn('occasion_id');
    table.dropColumn('link_text');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('promo_videos', table => {
    table.integer('category_id').unsigned().references('id').inTable('categories').onDelete('SET NULL');
    table.integer('gender_id').unsigned().references('id').inTable('genders').onDelete('SET NULL');
    table.integer('occasion_id').unsigned().references('id').inTable('occasions').onDelete('SET NULL');
    table.string('link_text').nullable();
  });
};
