const knex = require('knex');
const knexConfig = require('../knexfile');

const db = knex(knexConfig.development);

async function listAllTables() {
  try {
    const result = await db.raw("SELECT schemaname, tablename FROM pg_catalog.pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema')");
    console.log('All tables:');
    console.table(result.rows);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

listAllTables();
