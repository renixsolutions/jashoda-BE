const bcrypt = require('bcryptjs');
require('dotenv').config();

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('users').del();
  
  // Hash password for admin using salt from env
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
  const hashedPassword = await bcrypt.hash('Admin@123', saltRounds);
  
  // Insert default admin user
  await knex('users').insert([
    {
      name: 'Yash Jain',
      email: 'jainyash9098@gmail.com',
      username: 'yash_admin',
      first_name: 'Yash',
      last_name: 'Jain',
      password: hashedPassword,
      status: 'active',
      role: 'SUPER_ADMIN',
      address: 'Jashoda Jewellers Headquarters',
      country: 'India',
      city: 'Mumbai',
      state: 'Maharashtra',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    }
  ]);
};

