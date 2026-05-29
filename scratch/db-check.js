const knex = require('knex');
const knexConfig = require('../knexfile');

const db = knex(knexConfig.development);

async function checkConnection() {
  console.log('Testing database connection...');
  console.log('Configuration:', {
    client: knexConfig.development.client,
    host: knexConfig.development.connection.host,
    port: knexConfig.development.connection.port,
    user: knexConfig.development.connection.user,
    database: knexConfig.development.connection.database
  });

  try {
    const result = await db.raw('SELECT 1+1 AS result');
    console.log('Successfully connected to the database.');
    console.log('Query result:', result.rows);
    process.exit(0);
  } catch (error) {
    console.error('Failed to connect to the database:');
    console.error(error.message);
    process.exit(1);
  }
}

checkConnection();
