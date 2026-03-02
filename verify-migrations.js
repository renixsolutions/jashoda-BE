require('dotenv').config();
const knex = require('./src/db/knex');
const fs = require('fs');
const path = require('path');

async function verify() {
  try {
    console.log('=== Migration Verification ===\n');
    
    // Get migrations from database
    const dbMigrations = await knex('knex_migrations').select('name').orderBy('id');
    console.log(`Database has ${dbMigrations.length} migration records:`);
    dbMigrations.forEach(m => console.log(`  ✓ ${m.name}`));
    
    // Get migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.js'))
      .sort();
    
    console.log(`\nFilesystem has ${files.length} migration files:`);
    files.forEach(f => console.log(`  ✓ ${f}`));
    
    // Check for mismatches
    const dbNames = dbMigrations.map(m => m.name);
    const missingInDb = files.filter(f => !dbNames.includes(f));
    const missingInFs = dbNames.filter(n => !files.includes(n));
    
    if (missingInDb.length > 0) {
      console.log(`\n⚠️  Files not in database (need to run migrations):`);
      missingInDb.forEach(f => console.log(`  - ${f}`));
    }
    
    if (missingInFs.length > 0) {
      console.log(`\n❌ Database records without files (orphaned):`);
      missingInFs.forEach(n => console.log(`  - ${n}`));
    }
    
    if (missingInDb.length === 0 && missingInFs.length === 0) {
      console.log(`\n✅ All migrations are in sync!`);
    }
    
    await knex.destroy();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    await knex.destroy();
    process.exit(1);
  }
}

verify();

