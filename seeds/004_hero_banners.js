/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('hero_banners').del();
  
  await knex('hero_banners').insert([
    {
      title: "Vedic divinity",
      brand_text: "Temple atelier",
      description: "A sacred dialogue between solid silver and ancient spirit. Each motif is a hereditary fragment of India's eternal temple architecture.",
      image_url: "/assets/images/hero_necklace.png",
      banner_type: "MAIN_HERO",
      order_index: 1,
      is_active: true
    },
    {
      title: "Rajputana lore",
      brand_text: "Imperial karigari",
      description: "Intricate filigree work that echoes the whispered secrets of the grand Jaipur Darbars. A monolithic statement of royal lineage.",
      image_url: "/assets/images/hero_ring.png",
      banner_type: "MAIN_HERO",
      order_index: 2,
      is_active: true
    },
    {
      title: "Banaras mist",
      brand_text: "Vintage manifesto",
      description: "Hand-hammered silver that captures the ethereal fracture of dawn over the Ganges. A cascading symphony of lunar brilliance.",
      image_url: "/assets/images/hero_necklace.png",
      banner_type: "MAIN_HERO",
      order_index: 3,
      is_active: true
    },
    {
      title: "Deccan noir",
      brand_text: "Oxidized chronicle",
      description: "Sultry obsidian stones encased in deep, antique-oxidized sterling. A dramatic interplay of southern shadow and moonlight.",
      image_url: "/assets/images/hero_ring.png",
      banner_type: "MAIN_HERO",
      order_index: 4,
      is_active: true
    },
    {
      title: "Nizam's legacy",
      brand_text: "Heritage couture",
      description: "Rare silver-work embracing the finest Basra pearls. A century-old heritage frozen in a state of absolute sterling perfection.",
      image_url: "/assets/images/hero_necklace.png",
      banner_type: "MAIN_HERO",
      order_index: 5,
      is_active: true
    },
    {
      title: "Atman series",
      brand_text: "Architectural soul",
      description: "Minimalist silver sculptures inscribed with sacred Sanskrit shlokas. Connecting the Atman to the tactile craft of the self.",
      image_url: "/assets/images/hero_ring.png",
      banner_type: "MAIN_HERO",
      order_index: 6,
      is_active: true
    }
  ]);
};
