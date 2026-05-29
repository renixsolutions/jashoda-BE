const knex = require('knex');
const knexConfig = require('../knexfile');

const db = knex(knexConfig.development);

async function checkCouponsTable() {
  try {
    const hasTable = await db.schema.hasTable('coupons');
    console.log('Has coupons table:', hasTable);
    if (hasTable) {
      const columns = await db('coupons').columnInfo();
      console.log('Coupons columns:', Object.keys(columns));
    }
    process.exit(0);
  } catch (error) {
    console.error('Error checking coupons table:', error.message);
    process.exit(1);
  }
}

checkCouponsTable();
