const { knex } = require('./src/db/connection');

async function checkTable() {
  try {
    const columns = await knex('coupons').columnInfo();
    console.log(JSON.stringify(columns, null, 2));
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

checkTable();
