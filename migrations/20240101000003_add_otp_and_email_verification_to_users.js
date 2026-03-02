 /**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('users', function (table) {
    table.string('phone', 20).nullable().unique();
    table.boolean('email_verified').defaultTo(false);
    table.string('title', 10).nullable(); // Mr, Ms, etc.
    table.string('email_verification_token', 255).nullable();
    table.timestamp('email_verification_expires_at').nullable();
    table.index('phone');
    table.index('email_verification_token');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('users', function (table) {
    table.dropIndex(['phone']);
    table.dropIndex(['email_verification_token']);
    table.dropColumn('phone');
    table.dropColumn('email_verified');
    table.dropColumn('title');
    table.dropColumn('email_verification_token');
    table.dropColumn('email_verification_expires_at');
  });
};
