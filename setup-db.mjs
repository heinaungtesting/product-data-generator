/**
 * Setup database using Prisma migrations via SQL
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read migration SQL files
const migrations = [
  'prisma/migrations/20251026104631_init/migration.sql',
  'prisma/migrations/20251026110000_bundle_path_unique/migration.sql'
];

console.log('🔧 Setting up database...');

// Create empty database file
const dbPath = path.join(__dirname, 'prisma', 'dev.db');
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, '');
  console.log('✅ Created database file');
}

// We need sqlite3 for this - let's install it
console.log('\n📦 Installing sqlite3...');

import { execSync } from 'child_process';

try {
  execSync('npm install better-sqlite3 --no-save', { stdio: 'inherit' });

  // Now import and use it
  const Database = (await import('better-sqlite3')).default;
  const db = Database(dbPath);

  console.log('\n🔄 Applying migrations...');

  for (const migrationPath of migrations) {
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    console.log(`  Applying: ${path.basename(path.dirname(migrationPath))}`);
    db.exec(sql);
  }

  db.close();

  console.log('✅ Database setup complete!\n');

  // Now run the data migration
  console.log('🔄 Running data migration...');
  execSync('node init-db.js', { stdio: 'inherit' });

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
