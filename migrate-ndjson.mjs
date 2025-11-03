/**
 * Migrate NDJSON data to SQLite database directly
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = path.join(__dirname, 'prisma', 'dev.db');
const ndjsonPath = path.join(__dirname, 'data', 'products.ndjson');

console.log('🔄 Migrating NDJSON data to database...');

try {
  const db = Database(dbPath);

  // Check if data already exists
  const count = db.prepare('SELECT COUNT(*) as count FROM Product').get();
  if (count.count > 0) {
    console.log(`ℹ️  Database already has ${count.count} products, skipping migration`);
    db.close();
    process.exit(0);
  }

  // Read NDJSON file
  if (!fs.existsSync(ndjsonPath)) {
    console.log('ℹ️  No existing NDJSON data found');
    db.close();
    process.exit(0);
  }

  const content = fs.readFileSync(ndjsonPath, 'utf-8');
  const lines = content.trim().split('\n');

  console.log(`📦 Found ${lines.length} products in NDJSON`);

  // Prepare statements
  const insertProduct = db.prepare(`
    INSERT INTO Product (id, category, pointValue, contentUpdatedAt, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertText = db.prepare(`
    INSERT INTO ProductText (productId, language, name, description, effects, sideEffects, goodFor)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertTag = db.prepare(`
    INSERT OR IGNORE INTO Tag (name) VALUES (?)
  `);

  const getTagId = db.prepare(`
    SELECT id FROM Tag WHERE name = ?
  `);

  const insertProductTag = db.prepare(`
    INSERT INTO ProductTag (productId, tagId) VALUES (?, ?)
  `);

  // Process each product in a transaction
  const migrate = db.transaction(() => {
    for (const line of lines) {
      const product = JSON.parse(line);

      // Insert product
      insertProduct.run(
        product.id,
        product.category,
        product.pointValue,
        product.contentUpdatedAt || product.createdAt,
        product.createdAt,
        product.updatedAt
      );

      // Insert texts
      for (const text of product.texts) {
        insertText.run(
          product.id,
          text.language,
          text.name,
          text.description,
          text.effects,
          text.sideEffects,
          text.goodFor
        );
      }

      // Insert tags
      if (product.tags && product.tags.length > 0) {
        for (const tagName of product.tags) {
          insertTag.run(tagName);
          const tag = getTagId.get(tagName);
          if (tag) {
            insertProductTag.run(product.id, tag.id);
          }
        }
      }

      console.log(`  ✓ Migrated: ${product.texts[0]?.name || product.id}`);
    }
  });

  migrate();

  // Show statistics
  const stats = {
    products: db.prepare('SELECT COUNT(*) as count FROM Product').get().count,
    tags: db.prepare('SELECT COUNT(*) as count FROM Tag').get().count,
    health: db.prepare("SELECT COUNT(*) as count FROM Product WHERE category = 'health'").get().count,
    cosmetic: db.prepare("SELECT COUNT(*) as count FROM Product WHERE category = 'cosmetic'").get().count,
  };

  console.log(`\n✅ Successfully migrated ${lines.length} products`);
  console.log('\n📊 Database Statistics:');
  console.log(`  Total Products: ${stats.products}`);
  console.log(`  Health: ${stats.health}`);
  console.log(`  Cosmetic: ${stats.cosmetic}`);
  console.log(`  Total Tags: ${stats.tags}`);

  db.close();

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
