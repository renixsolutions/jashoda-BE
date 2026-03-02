/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('products', function (table) {
    // Basic Product Info
    table.string('sku', 100).nullable().unique();
    table.string('subcategory', 100).nullable();
    table.string('brand', 100).nullable();
    table.text('short_description').nullable();
    
    // Pricing & Tax
    table.decimal('discount_price', 12, 2).nullable();
    table.decimal('making_charges', 12, 2).nullable();
    table.decimal('gst_percentage', 5, 2).nullable();
    table.string('currency', 10).defaultTo('INR');
    table.string('price_label', 100).nullable();
    table.timestamp('offer_start_date').nullable();
    table.timestamp('offer_end_date').nullable();
    
    // Material & Specifications
    table.string('metal_type', 50).nullable(); // Gold, Silver, Platinum
    table.string('purity', 50).nullable(); // 18K, 22K, 925 Silver
    table.decimal('metal_weight', 10, 3).nullable(); // grams
    table.string('stone_type', 50).nullable(); // Diamond, Zircon, None
    table.decimal('stone_weight', 10, 3).nullable(); // carat
    table.integer('stone_count').nullable();
    table.string('certification', 100).nullable(); // IGI, GIA
    table.decimal('length', 10, 2).nullable(); // mm
    table.decimal('width', 10, 2).nullable(); // mm
    table.string('ring_size', 20).nullable();
    
    // Inventory
    table.integer('stock_quantity').defaultTo(0);
    table.integer('low_stock_threshold').defaultTo(5);
    table.enum('stock_status', ['in_stock', 'out_of_stock', 'low_stock']).defaultTo('in_stock');
    
    // SEO Fields
    table.string('meta_title', 255).nullable();
    table.text('meta_description').nullable();
    table.string('tags', 500).nullable(); // comma separated
    
    // Shipping Info
    table.decimal('weight', 10, 3).nullable(); // grams
    table.string('shipping_class', 50).nullable();
    table.boolean('returnable').defaultTo(true);
    table.string('warranty', 100).nullable();
    
    // Variants (stored as JSON for flexibility)
    table.json('variants').nullable();
    
    // Additional media
    table.string('hover_image_url', 500).nullable();
    table.string('video_url', 500).nullable();
    
    // Indexes
    table.index('sku');
    table.index('metal_type');
    table.index('stock_status');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('products', function (table) {
    table.dropColumn('sku');
    table.dropColumn('subcategory');
    table.dropColumn('brand');
    table.dropColumn('short_description');
    table.dropColumn('discount_price');
    table.dropColumn('making_charges');
    table.dropColumn('gst_percentage');
    table.dropColumn('currency');
    table.dropColumn('price_label');
    table.dropColumn('offer_start_date');
    table.dropColumn('offer_end_date');
    table.dropColumn('metal_type');
    table.dropColumn('purity');
    table.dropColumn('metal_weight');
    table.dropColumn('stone_type');
    table.dropColumn('stone_weight');
    table.dropColumn('stone_count');
    table.dropColumn('certification');
    table.dropColumn('length');
    table.dropColumn('width');
    table.dropColumn('ring_size');
    table.dropColumn('stock_quantity');
    table.dropColumn('low_stock_threshold');
    table.dropColumn('stock_status');
    table.dropColumn('meta_title');
    table.dropColumn('meta_description');
    table.dropColumn('tags');
    table.dropColumn('weight');
    table.dropColumn('shipping_class');
    table.dropColumn('returnable');
    table.dropColumn('warranty');
    table.dropColumn('variants');
    table.dropColumn('hover_image_url');
    table.dropColumn('video_url');
  });
};

