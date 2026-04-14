
exports.up = function(knex) {
  return knex.schema
    .createTable('marquee_messages', (table) => {
      table.increments('id').primary();
      table.string('text').notNullable();
      table.integer('display_order').defaultTo(0);
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    .createTable('marquee_settings', (table) => {
      table.increments('id').primary();
      table.integer('speed').defaultTo(25);
      table.string('bg_color').defaultTo('#702540');
      table.string('text_color').defaultTo('#ffffff');
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    .then(() => {
        return knex('marquee_messages').insert([
            { text: 'Free Shipping On Orders Above ₹50,000', display_order: 1 },
            { text: '100% Certified Jewellery', display_order: 2 },
            { text: 'Lifetime Exchange & Buyback', display_order: 3 },
            { text: 'Secure & Insured Delivery', display_order: 4 }
        ]);
    })
    .then(() => {
        return knex('marquee_settings').insert([
            { speed: 25, bg_color: '#702540', text_color: '#ffffff', is_active: true }
        ]);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('marquee_messages')
    .dropTableIfExists('marquee_settings');
};
