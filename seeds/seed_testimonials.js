/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('testimonials').del();
  await knex('testimonials').insert([
    {
      name: "Akanksha Khanna, 27",
      content: "Delighted with my engagement ring from BlueStone! It's my dream ring, fits perfectly and is stunning to look at. Thanks, BlueStone, for helping us find the perfect symbol of love!",
      image_url: "/customer1.png",
      rotation: -2,
      rating: 5,
      order_index: 0
    },
    {
      name: "Nutan Mishra, 33",
      content: "I got a Nazariya for my baby boy from BlueStone. It's so cute seeing it on my little one's wrist, and it gives me a sense of security knowing it's there. Thanks, BlueStone!",
      image_url: "/customer1.png",
      rotation: 2,
      rating: 5,
      order_index: 1
    },
    {
      name: "Divya Mishra, 26",
      content: "On Valentine's Day, my husband gifted me a necklace from BlueStone, and I haven't taken it off even once. Everyone asks me where it's from, and I just LOVE how nice it looks on me.",
      image_url: "/customer1.png",
      rotation: -1,
      rating: 5,
      order_index: 2
    },
    {
      name: "Anuska Ananya, 24",
      content: "BlueStone is my go-to place for jewellery. I love that I can wear their jewellery to work, dates, parties and brunches; it goes with everything and makes my outfits look stylish and trendy.",
      image_url: "/customer1.png",
      rotation: 3,
      rating: 4,
      order_index: 3
    }
  ]);
};
