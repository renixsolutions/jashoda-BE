require('dotenv').config();
const knex = require('./src/db/knex');

async function check() {
  try {
    const lastItems = await knex('order_items').orderBy('id', 'desc').limit(5);
    console.log('Last 5 Order Items:');
    console.table(lastItems.map(i => ({ id: i.id, product_id: i.product_id, size_id: i.size_id, quantity: i.quantity })));

    const products = await knex('products').whereIn('id', lastItems.map(i => i.product_id));
    console.log('\nProducts Variants:');
    products.forEach(p => {
      console.log(`Product ID: ${p.id}, Total Stock: ${p.stock_quantity}`);
      console.log('Variants Type:', typeof p.variants);
      console.log('Variants:', p.variants);
    });

  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

check();
