/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const hasColumn = await knex.schema.hasColumn('coupons', 'title');
  if (!hasColumn) {
    return knex.schema.alterTable('coupons', (table) => {
      table.string('title').nullable();
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  const hasColumn = await knex.schema.hasColumn('coupons', 'title');
  if (hasColumn) {
    return knex.schema.alterTable('coupons', (table) => {
      table.dropColumn('title');
    });
  }
};
