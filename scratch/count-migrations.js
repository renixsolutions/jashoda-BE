const knex = require('knex');
const knexConfig = require('../knexfile');

const db = knex(knexConfig.development);

async function countMigrations() {
  try {
    const count = await db('knex_migrations').count('* as count');
    console.log('Migration count:', count[0].count);
    
    const lastMigrations = await db('knex_migrations').orderBy('id', 'desc').limit(5);
    console.log('Last 5 migrations:');
    console.table(lastMigrations);
    
    process.exit(0);
  } catch (error) {
    console.error('Error counting migrations:', error.message);
    process.exit(1);
  }
}

countMigrations();
