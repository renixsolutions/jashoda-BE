const knex = require('knex');
const knexConfig = require('../knexfile');

const db = knex(knexConfig.development);

async function checkMigrations() {
  try {
    const result = await db.select('*').from('knex_migrations').orderBy('id', 'asc');
    console.log('Current Migrations:');
    console.table(result);
    process.exit(0);
  } catch (error) {
    console.error('Error fetching migrations:', error.message);
    process.exit(1);
  }
}

checkMigrations();
