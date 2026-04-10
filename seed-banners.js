require('dotenv').config({ path: './.env' });
const db = require('./src/db/knex');

async function seed() {
  try {
    console.log('Seeding hero banners...');
    
    // Check if table exists
    const hasTable = await db.schema.hasTable('hero_banners');
    if (!hasTable) {
        console.error('Table hero_banners does not exist. Run migrations first.');
        process.exit(1);
    }

    // Clear existing
    await db('hero_banners').del();
    
    const banners = [
      {
        title: "Season Of Style '25",
        brand_text: "Jashoda Jewels",
        description: "From India's most loved designs that captured hearts, a tribute to the elegance and joy that defined the year.",
        image_url: "/sil1.png", // Using the placeholder from original component
        cta_text: "EXPLORE NOW",
        bg_color: "bg-[#F9F4F0]",
        accent_color: "text-[#8B5E3C]",
        order_index: 1,
        is_active: true
      },
      {
        title: "Timeless Elegance",
        brand_text: "Jashoda Jewels",
        description: "Discover the perfect blend of tradition and modernity with our exclusive diamond collection.",
        image_url: "/sil1.png",
        cta_text: "SHOP COLLECTION",
        bg_color: "bg-[#F0F4F8]",
        accent_color: "text-[#2C3E50]",
        order_index: 2,
        is_active: true
      },
      {
        title: "Wedding Bliss",
        brand_text: "Jashoda Jewels",
        description: "Celebrate your special day with jewelry that shines as bright as your love.",
        image_url: "/sil1.png",
        cta_text: "VIEW DESIGNS",
        bg_color: "bg-[#FFF0F5]",
        accent_color: "text-[#8B0000]",
        order_index: 3,
        is_active: true
      }
    ];

    await db('hero_banners').insert(banners);
    console.log('Seed successful!');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
