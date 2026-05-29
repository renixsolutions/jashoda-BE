const knex = require('knex');
const knexConfig = require('../knexfile');

const db = knex(knexConfig.development);

async function debugConnection() {
  try {
    const dbName = await db.raw('SELECT current_database()');
    console.log('Connected to DB:', dbName.rows[0].current_database);
    
    const migrations = await db.raw('SELECT * FROM knex_migrations');
    console.log('Migrations in table:', migrations.rows.length);
    if (migrations.rows.length > 0) {
        console.table(migrations.rows);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

debugConnection();
