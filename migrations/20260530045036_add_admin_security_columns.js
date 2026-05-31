/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable('users', (table) => {
    // Role-based access control
    table.string('role', 20).defaultTo('CUSTOMER').notNullable();

    // 2FA columns
    table.string('two_fa_code_hash', 255).nullable();
    table.timestamp('two_fa_expires_at').nullable();
    table.integer('two_fa_attempts').defaultTo(0).notNullable();

    // Password reset columns
    table.string('reset_password_token_hash', 255).nullable();
    table.timestamp('reset_password_expires_at').nullable();

    // Session invalidation — tracks when password was last changed
    table.timestamp('password_changed_at').nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('role');
    table.dropColumn('two_fa_code_hash');
    table.dropColumn('two_fa_expires_at');
    table.dropColumn('two_fa_attempts');
    table.dropColumn('reset_password_token_hash');
    table.dropColumn('reset_password_expires_at');
    table.dropColumn('password_changed_at');
  });
};
