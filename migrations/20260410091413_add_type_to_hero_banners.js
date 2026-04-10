/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table('hero_banners', function(table) {
    table.string('banner_type').defaultTo('PROMO_CAROUSEL'); // MAIN_HERO, PROMO_CAROUSEL
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('hero_banners', function(table) {
    table.dropColumn('banner_type');
  });
};
