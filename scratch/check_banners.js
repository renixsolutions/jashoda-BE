const knex = require('knex')(require('../knexfile').development);

async function checkBanners() {
  const banners = await knex('hero_banners').select('*');
  console.log(JSON.stringify(banners, null, 2));
  process.exit(0);
}

checkBanners();
