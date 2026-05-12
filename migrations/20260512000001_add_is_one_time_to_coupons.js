exports.up = function(knex) {
  return knex.schema.table('coupons', (table) => {
    table.boolean('is_one_time').defaultTo(false);
  });
};

exports.down = function(knex) {
  return knex.schema.table('coupons', (table) => {
    table.dropColumn('is_one_time');
  });
};
