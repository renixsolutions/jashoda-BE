/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  await knex('genders').del();

  const genders = [
    { name: 'Male', slug: 'male' },
    { name: 'Female', slug: 'female' },
    { name: 'Unisex', slug: 'unisex' },
    { name: 'Kids', slug: 'kids' },
    { name: 'Couple', slug: 'couple' },
    { name: 'Other', slug: 'other' }
  ];

  await knex('genders').insert(
    genders.map((g) => ({
      ...g,
      status: 'active',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    }))
  );
};

