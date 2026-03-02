/**
 * Seed silver jewellery category hierarchy and sample products.
 *
 * Uses a marketing-friendly taxonomy for categories and subcategories,
 * and links dummy products to the correct parent category and subcategory IDs.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

exports.seed = async function (knex) {
  // Clear existing data in FK‑safe order
  await knex('order_items').del();
  await knex('products').del();
  await knex('categories').del();

  // Top-level category groups and their subcategories (2-level hierarchy)
  const CATEGORY_GROUPS = [
    {
      name: 'Rings',
      children: [
        'Silver Rings',
        'Adjustable Rings',
        'Statement Rings',
        'Minimal Rings',
        'Stackable Rings',
        'Couple Rings',
        'Promise Rings',
        'Engagement Rings',
        'Cocktail Rings',
        'Birthstone Rings',
        'Initial Rings',
        'Infinity Rings'
      ]
    },
    {
      name: 'Earrings',
      children: [
        'Stud Earrings',
        'Hoop Earrings',
        'Huggie Earrings',
        'Drop Earrings',
        'Dangle Earrings',
        'Jhumkas',
        'Chandbali Earrings',
        'Ear Cuffs',
        'Ear Climbers',
        'Jacket Earrings',
        'Minimal Earrings',
        'Party Wear Earrings',
        'Office Wear Earrings'
      ]
    },
    {
      name: 'Necklaces',
      children: [
        'Silver Necklaces',
        'Layered Necklaces',
        'Choker Necklaces',
        'Statement Necklaces',
        'Minimal Necklaces',
        'Long Necklaces',
        'Pearl Necklaces',
        'Chain Necklaces'
      ]
    },
    {
      name: 'Pendants',
      children: [
        'Pendant Sets',
        'Solitaire Pendants',
        'Heart Pendants',
        'Alphabet Pendants',
        'Name Pendants',
        'Zodiac Pendants',
        'Religious Pendants',
        'Infinity Pendants',
        'Love Pendants',
        'Locket Pendants'
      ]
    },
    {
      name: 'Chains',
      children: [
        'Box Chains',
        'Cable Chains',
        'Rope Chains',
        'Snake Chains',
        'Figaro Chains',
        'Flat Chains',
        'Adjustable Chains'
      ]
    },
    {
      name: 'Bracelets',
      children: [
        'Chain Bracelets',
        'Charm Bracelets',
        'Tennis Bracelets',
        'Link Bracelets',
        'Minimal Bracelets',
        'Couple Bracelets',
        'Adjustable Bracelets',
        'Personalised Bracelets'
      ]
    },
    {
      name: 'Bangles & Kada',
      children: [
        'Silver Bangles',
        'Openable Bangles',
        'Kada Bracelets',
        'Traditional Bangles',
        'Designer Bangles',
        'Stackable Bangles'
      ]
    },
    {
      name: 'Anklets',
      children: [
        'Single Anklets',
        'Pair Anklets',
        'Charm Anklets',
        'Layered Anklets',
        'Traditional Anklets',
        'Minimal Anklets',
        'Adjustable Anklets'
      ]
    },
    {
      name: 'Jewellery Sets',
      children: [
        'Necklace Sets',
        'Pendant & Earrings Sets',
        'Matching Jewellery Sets',
        'Bridal Sets',
        'Festive Sets',
        'Gift Sets'
      ]
    },
    {
      name: 'Nose Jewellery',
      children: [
        'Nose Pins',
        'Nose Rings',
        'Nath',
        'Clip-On Nose Pins'
      ]
    },
    {
      name: 'Toe Rings',
      children: [
        'Adjustable Toe Rings',
        'Traditional Toe Rings',
        'Minimal Toe Rings',
        'Couple Toe Rings'
      ]
    },
    {
      name: 'Religious & Spiritual Jewellery',
      children: [
        'Om Jewellery',
        'Ganesha Jewellery',
        'Lakshmi Jewellery',
        'Rudraksha Jewellery',
        'Cross Jewellery',
        'Spiritual Symbols',
        'Navratna Jewellery'
      ]
    },
    {
      name: 'Personalised Jewellery',
      children: [
        'Name Jewellery',
        'Initial Jewellery',
        'Engraved Jewellery',
        'Photo Jewellery',
        'Custom Message Jewellery'
      ]
    },
    {
      name: 'Men\'s Silver Jewellery',
      children: [
        'Men Rings',
        'Men Chains',
        'Men Bracelets',
        'Men Kada',
        'Men Pendants',
        'Men Accessories'
      ]
    },
    {
      name: 'Kids Silver Jewellery',
      children: [
        'Kids Bracelets',
        'Kids Anklets',
        'Kids Earrings',
        'Kids Pendants',
        'Baby Gift Jewellery'
      ]
    },
    {
      name: 'Collections',
      children: [
        'New Arrivals',
        'Best Sellers',
        'Trending Now',
        'Everyday Wear',
        'Office Wear',
        'Party Wear',
        'Wedding Collection',
        'Festive Collection',
        'Minimal Collection',
        'Gift Collection'
      ]
    }
  ];

  // Insert parent categories
  const parentRows = await knex('categories')
    .insert(
      CATEGORY_GROUPS.map(group => ({
        name: group.name,
        slug: slugify(group.name),
        description: `${group.name} category`,
        status: 'active',
        image_url: null,
        parent_id: null,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      }))
    )
    .returning('*');

  const parentByName = {};
  parentRows.forEach(row => {
    parentByName[row.name] = row;
  });

  // Insert subcategories and build lookup: subIds[parentName][childName] = id
  const subIds = {};

  for (const group of CATEGORY_GROUPS) {
    const parent = parentByName[group.name];
    subIds[group.name] = {};

    if (!group.children || !group.children.length) continue;

    const inserted = await knex('categories')
      .insert(
        group.children.map(childName => ({
          name: childName,
          slug: slugify(childName),
          description: childName,
          status: 'active',
          image_url: null,
          parent_id: parent.id,
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        }))
      )
      .returning('*');

    inserted.forEach(row => {
      subIds[group.name][row.name] = row.id;
    });
  }

  // Helper to get IDs safely
  function catId(name) {
    return parentByName[name]?.id;
  }
  function subId(parentName, childName) {
    return subIds[parentName]?.[childName];
  }

  // Sample products mapped to category + subcategory IDs
  const products = [
    {
      name: 'Minimal Stackable Silver Ring Set',
      slug: 'minimal-stackable-silver-ring-set',
      description: 'Set of three minimal stackable silver rings perfect for everyday wear.',
      price: 2199.0,
      category: catId('Rings'),
      subcategory: subId('Rings', 'Stackable Rings'),
      sku: 'SVR-STK-001',
      stock_quantity: 24,
      low_stock_threshold: 6,
      stock_status: 'in_stock',
      metal_type: 'Silver',
      purity: '925 Silver',
      short_description: 'Stackable minimal silver rings'
    },
    {
      name: 'Statement Cocktail Silver Ring',
      slug: 'statement-cocktail-silver-ring',
      description: 'Bold cocktail ring with a high-polish silver finish for party looks.',
      price: 2899.0,
      category: catId('Rings'),
      subcategory: subId('Rings', 'Cocktail Rings'),
      sku: 'SVR-CKT-002',
      stock_quantity: 10,
      low_stock_threshold: 4,
      stock_status: 'in_stock',
      metal_type: 'Silver',
      purity: '925 Silver',
      short_description: 'Bold cocktail silver ring'
    },
    {
      name: 'Office Wear Silver Stud Earrings',
      slug: 'office-wear-silver-stud-earrings',
      description: 'Tiny silver stud earrings designed for comfortable everyday office wear.',
      price: 799.0,
      category: catId('Earrings'),
      subcategory: subId('Earrings', 'Stud Earrings'),
      sku: 'SVE-STD-003',
      stock_quantity: 40,
      low_stock_threshold: 8,
      stock_status: 'in_stock',
      metal_type: 'Silver',
      purity: '925 Silver',
      short_description: 'Minimal office-wear studs'
    },
    {
      name: 'Party Wear Silver Jhumkas',
      slug: 'party-wear-silver-jhumkas',
      description: 'Oxidized silver jhumkas with intricate detailing for festive occasions.',
      price: 1899.0,
      category: catId('Earrings'),
      subcategory: subId('Earrings', 'Jhumkas'),
      sku: 'SVE-JHM-004',
      stock_quantity: 14,
      low_stock_threshold: 5,
      stock_status: 'in_stock',
      metal_type: 'Silver',
      purity: '925 Silver',
      short_description: 'Festive silver jhumkas'
    },
    {
      name: 'Layered Silver Necklace',
      slug: 'layered-silver-necklace',
      description: 'Delicate layered silver necklace that pairs well with western and ethnic outfits.',
      price: 3499.0,
      category: catId('Necklaces'),
      subcategory: subId('Necklaces', 'Layered Necklaces'),
      sku: 'SVN-LYR-005',
      stock_quantity: 9,
      low_stock_threshold: 3,
      stock_status: 'low_stock',
      metal_type: 'Silver',
      purity: '925 Silver',
      short_description: 'Delicate layered silver necklace'
    },
    {
      name: 'Minimal Choker Silver Necklace',
      slug: 'minimal-choker-silver-necklace',
      description: 'Slim silver choker necklace for minimal everyday styling.',
      price: 2599.0,
      category: catId('Necklaces'),
      subcategory: subId('Necklaces', 'Choker Necklaces'),
      sku: 'SVN-CHK-006',
      stock_quantity: 0,
      low_stock_threshold: 4,
      stock_status: 'out_of_stock',
      metal_type: 'Silver',
      purity: '925 Silver',
      short_description: 'Minimal silver choker'
    },
    {
      name: 'Heart Silver Pendant with Chain',
      slug: 'heart-silver-pendant-with-chain',
      description: 'Classic heart-shaped silver pendant with a fine chain, perfect as a gift.',
      price: 2299.0,
      category: catId('Pendants'),
      subcategory: subId('Pendants', 'Heart Pendants'),
      sku: 'SVP-HRT-007',
      stock_quantity: 18,
      low_stock_threshold: 4,
      stock_status: 'in_stock',
      metal_type: 'Silver',
      purity: '925 Silver',
      short_description: 'Gift-ready heart pendant'
    },
    {
      name: 'Zodiac Silver Pendant',
      slug: 'zodiac-silver-pendant',
      description: 'Personalised zodiac silver pendant for everyday wear.',
      price: 1999.0,
      category: catId('Pendants'),
      subcategory: subId('Pendants', 'Zodiac Pendants'),
      sku: 'SVP-ZOD-008',
      stock_quantity: 20,
      low_stock_threshold: 5,
      stock_status: 'in_stock',
      metal_type: 'Silver',
      purity: '925 Silver',
      short_description: 'Zodiac sign pendant'
    },
    {
      name: 'Adjustable Silver Chain',
      slug: 'adjustable-silver-chain',
      description: 'Smooth silver chain with adjustable length for versatile styling.',
      price: 1799.0,
      category: catId('Chains'),
      subcategory: subId('Chains', 'Adjustable Chains'),
      sku: 'SVC-ADJ-009',
      stock_quantity: 16,
      low_stock_threshold: 4,
      stock_status: 'in_stock',
      metal_type: 'Silver',
      purity: '925 Silver',
      short_description: 'Adjustable silver chain'
    },
    {
      name: 'Charm Silver Bracelet',
      slug: 'charm-silver-bracelet',
      description: 'Delicate chain bracelet with tiny silver charms, ideal for gifting.',
      price: 1499.0,
      category: catId('Bracelets'),
      subcategory: subId('Bracelets', 'Charm Bracelets'),
      sku: 'SVB-CHM-010',
      stock_quantity: 22,
      low_stock_threshold: 5,
      stock_status: 'in_stock',
      metal_type: 'Silver',
      purity: '925 Silver',
      short_description: 'Charm silver bracelet'
    },
    {
      name: 'Traditional Silver Kada',
      slug: 'traditional-silver-kada',
      description: 'Heavy traditional silver kada bracelet with intricate motifs.',
      price: 3999.0,
      category: catId('Bangles & Kada'),
      subcategory: subId('Bangles & Kada', 'Kada Bracelets'),
      sku: 'SVK-KAD-011',
      stock_quantity: 7,
      low_stock_threshold: 3,
      stock_status: 'low_stock',
      metal_type: 'Silver',
      purity: '925 Silver',
      short_description: 'Traditional silver kada'
    },
    {
      name: 'Pair of Layered Silver Anklets',
      slug: 'pair-layered-silver-anklets',
      description: 'Set of layered silver anklets with tiny charms, sold as a pair.',
      price: 1899.0,
      category: catId('Anklets'),
      subcategory: subId('Anklets', 'Layered Anklets'),
      sku: 'SVA-LYR-012',
      stock_quantity: 12,
      low_stock_threshold: 4,
      stock_status: 'in_stock',
      metal_type: 'Silver',
      purity: '925 Silver',
      short_description: 'Layered anklet pair'
    }
  ];

  await knex('products').insert(
    products.map(p => ({
      ...p,
      status: p.status || 'active',
      currency: 'INR',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    }))
  );
}

/**
 * Seed silver jewellery categories (with hierarchy) and sample products.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Clear existing data (respect FK from order_items -> products)
  await knex('order_items').del();
  await knex('products').del();
  await knex('categories').del();

  // Root category for silver jewellery
  const [silverRoot] = await knex('categories')
    .insert({
      name: 'Silver Jewellery',
      slug: 'silver-jewellery',
      description: 'All silver jewellery categories',
      status: 'active',
      image_url: null,
      parent_id: null,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    })
    .returning('*');

  // Subcategories under Silver Jewellery
  const silverSubcategories = [
    { name: 'Rings', slug: 'silver-rings' },
    { name: 'Bangles', slug: 'silver-bangles' },
    { name: 'Bracelets', slug: 'silver-bracelets' },
    { name: 'Necklaces', slug: 'silver-necklaces' },
    { name: 'Pendants', slug: 'silver-pendants' },
    { name: 'Earrings', slug: 'silver-earrings' },
    { name: 'Mangalsutras', slug: 'silver-mangalsutras' },
    { name: 'Anklets', slug: 'silver-anklets' },
    { name: 'Nose Pins', slug: 'silver-nose-pins' },
    { name: 'Chains', slug: 'silver-chains' }
  ];

  const insertedSilverSubcats = await knex('categories')
    .insert(
      silverSubcategories.map(c => ({
        name: c.name,
        slug: c.slug,
        description: `${c.name} in silver`,
        status: 'active',
        image_url: null,
        parent_id: silverRoot.id,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      }))
    )
    .returning('*');

  const silverSubcategoryIdBySlug = {};
  insertedSilverSubcats.forEach(c => {
    silverSubcategoryIdBySlug[c.slug] = c.id;
  });

  // Additional dummy root categories + subcategories (for future products)
  const [goldRoot] = await knex('categories')
    .insert({
      name: 'Gold Jewellery',
      slug: 'gold-jewellery',
      description: 'All gold jewellery categories',
      status: 'active',
      image_url: null,
      parent_id: null,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    })
    .returning('*');

  const goldSubcategories = [
    { name: 'Gold Rings', slug: 'gold-rings' },
    { name: 'Gold Necklaces', slug: 'gold-necklaces' },
    { name: 'Gold Earrings', slug: 'gold-earrings' }
  ];

  await knex('categories')
    .insert(
      goldSubcategories.map(c => ({
        name: c.name,
        slug: c.slug,
        description: `${c.name} in gold`,
        status: 'active',
        image_url: null,
        parent_id: goldRoot.id,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      }))
    );

  const products = [
    {
      name: 'Classic Silver Ring',
      slug: 'classic-silver-ring',
      description: 'Elegant sterling silver ring with minimalist design. Perfect for everyday wear.',
      price: 2499.0,
      category: silverRoot.id,
      subcategory: silverSubcategoryIdBySlug['silver-rings'],
      sku: 'SVR-CLSC-001',
      stock_quantity: 25,
      low_stock_threshold: 5,
      stock_status: 'in_stock',
      image_url: null,
      status: 'active'
    },
    {
      name: 'Textured Silver Band Ring',
      slug: 'textured-silver-band-ring',
      description: 'Wide textured silver band with a modern brushed finish.',
      price: 2799.0,
      category: silverRoot.id,
      subcategory: silverSubcategoryIdBySlug['silver-rings'],
      sku: 'SVR-TXT-002',
      stock_quantity: 12,
      low_stock_threshold: 4,
      stock_status: 'in_stock',
      image_url: null,
      status: 'active'
    },
    {
      name: 'Silver Oxidized Bangle',
      slug: 'silver-oxidized-bangle',
      description: 'Traditional oxidized silver bangle with intricate patterns.',
      price: 1899.0,
      category: silverRoot.id,
      subcategory: silverSubcategoryIdBySlug['silver-bangles'],
      sku: 'SVB-OXID-003',
      stock_quantity: 8,
      low_stock_threshold: 3,
      stock_status: 'low_stock',
      image_url: null,
      status: 'active'
    },
    {
      name: 'Minimal Silver Bracelet',
      slug: 'minimal-silver-bracelet',
      description: 'Slim silver bracelet with a clean, everyday silhouette.',
      price: 1599.0,
      category: silverRoot.id,
      subcategory: silverSubcategoryIdBySlug['silver-bracelets'],
      sku: 'SVB-MIN-004',
      stock_quantity: 18,
      low_stock_threshold: 4,
      stock_status: 'in_stock',
      image_url: null,
      status: 'active'
    },
    {
      name: 'Silver Pendant with Chain',
      slug: 'silver-pendant-with-chain',
      description: 'Delicate silver pendant on a fine silver chain. Ideal for gifting.',
      price: 3299.0,
      category: silverRoot.id,
      subcategory: silverSubcategoryIdBySlug['silver-pendants'],
      sku: 'SVP-CHN-005',
      stock_quantity: 10,
      low_stock_threshold: 3,
      stock_status: 'in_stock',
      image_url: null,
      status: 'active'
    },
    {
      name: 'Floral Silver Pendant',
      slug: 'floral-silver-pendant',
      description: 'Handcrafted floral silver pendant with subtle oxidized detailing.',
      price: 2999.0,
      category: silverRoot.id,
      subcategory: silverSubcategoryIdBySlug['silver-pendants'],
      sku: 'SVP-FLR-006',
      stock_quantity: 0,
      low_stock_threshold: 3,
      stock_status: 'out_of_stock',
      image_url: null,
      status: 'active'
    },
    {
      name: 'Silver Jhumka Earrings',
      slug: 'silver-jhumka-earrings',
      description: 'Lightweight silver jhumkas with traditional craftsmanship.',
      price: 1599.0,
      category: silverRoot.id,
      subcategory: silverSubcategoryIdBySlug['silver-earrings'],
      sku: 'SVE-JHM-007',
      stock_quantity: 20,
      low_stock_threshold: 5,
      stock_status: 'in_stock',
      image_url: null,
      status: 'active'
    },
    {
      name: 'Silver Stud Earrings',
      slug: 'silver-stud-earrings',
      description: 'Simple sterling silver stud earrings. Hypoallergenic.',
      price: 699.0,
      category: silverRoot.id,
      subcategory: silverSubcategoryIdBySlug['silver-earrings'],
      sku: 'SVE-STD-008',
      stock_quantity: 30,
      low_stock_threshold: 6,
      stock_status: 'in_stock',
      image_url: null,
      status: 'active'
    },
    {
      name: 'Silver Mangalsutra',
      slug: 'silver-mangalsutra',
      description: 'Elegant silver mangalsutra with black beads and pendant.',
      price: 4499.0,
      category: silverRoot.id,
      subcategory: silverSubcategoryIdBySlug['silver-mangalsutras'],
      sku: 'SVM-MNG-009',
      stock_quantity: 6,
      low_stock_threshold: 3,
      stock_status: 'low_stock',
      image_url: null,
      status: 'active'
    },
    {
      name: 'Silver Anklet with Bells',
      slug: 'silver-anklet-with-bells',
      description: 'Beautiful silver anklet with small bells. Comfortable for daily use.',
      price: 999.0,
      category: silverRoot.id,
      subcategory: silverSubcategoryIdBySlug['silver-anklets'],
      sku: 'SVA-ANK-010',
      stock_quantity: 15,
      low_stock_threshold: 4,
      stock_status: 'in_stock',
      image_url: null,
      status: 'active'
    },
    {
      name: 'Silver Nose Pin',
      slug: 'silver-nose-pin',
      description: 'Classic silver nose pin with secure clasp.',
      price: 499.0,
      category: silverRoot.id,
      subcategory: silverSubcategoryIdBySlug['silver-nose-pins'],
      sku: 'SVN-NOS-011',
      stock_quantity: 40,
      low_stock_threshold: 8,
      stock_status: 'in_stock',
      image_url: null,
      status: 'active'
    },
    {
      name: 'Silver Chain Necklace',
      slug: 'silver-chain-necklace',
      description: 'Sleek silver chain necklace. Versatile for layering.',
      price: 2199.0,
      category: silverRoot.id,
      subcategory: silverSubcategoryIdBySlug['silver-chains'],
      sku: 'SVC-CHN-012',
      stock_quantity: 9,
      low_stock_threshold: 3,
      stock_status: 'low_stock',
      image_url: null,
      status: 'active'
    }
  ];

  await knex('products').insert(
    products.map(p => ({
      ...p,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    }))
  );
};
