const knex = require('knex');
const knexConfig = require('../knexfile');

const db = knex(knexConfig.development);

async function listTables() {
  try {
    const result = await db.raw("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'");
    console.log('Tables in database:');
    console.table(result.rows);
    process.exit(0);
  } catch (error) {
    console.error('Error listing tables:', error.message);
    process.exit(1);
  }
}

listTables();
