/**
 * Initialize database and migrate NDJSON data to Prisma
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./prisma/dev.db'
    }
  }
});

async function migrateNDJSON() {
  console.log('🔄 Migrating NDJSON data to Prisma database...');

  const ndjsonPath = path.join(process.cwd(), 'data', 'products.ndjson');

  try {
    const content = await fs.readFile(ndjsonPath, 'utf-8');
    const lines = content.trim().split('\n');

    console.log(`📦 Found ${lines.length} products in NDJSON`);

    for (const line of lines) {
      const product = JSON.parse(line);

      // Create product with texts
      await prisma.product.create({
        data: {
          id: product.id,
          category: product.category,
          pointValue: product.pointValue,
          contentUpdatedAt: new Date(product.contentUpdatedAt || product.createdAt),
          createdAt: new Date(product.createdAt),
          updatedAt: new Date(product.updatedAt),
          texts: {
            create: product.texts.map(text => ({
              language: text.language,
              name: text.name,
              description: text.description,
              effects: text.effects,
              sideEffects: text.sideEffects,
              goodFor: text.goodFor
            }))
          },
          tags: {
            create: product.tags ? product.tags.map(tagName => ({
              tag: {
                connectOrCreate: {
                  where: { name: tagName },
                  create: { name: tagName }
                }
              }
            })) : []
          }
        }
      });

      console.log(`  ✓ Migrated: ${product.texts[0]?.name || product.id}`);
    }

    console.log(`✅ Successfully migrated ${lines.length} products`);

  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('ℹ️  No existing NDJSON data found, starting with empty database');
    } else {
      console.error('❌ Migration error:', error);
      throw error;
    }
  }
}

async function main() {
  try {
    // Test database connection
    console.log('🔌 Connecting to database...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Check if database already has data
    const count = await prisma.product.count();
    if (count > 0) {
      console.log(`ℹ️  Database already has ${count} products, skipping migration`);
    } else {
      await migrateNDJSON();
    }

    // Show statistics
    const stats = {
      products: await prisma.product.count(),
      tags: await prisma.tag.count(),
      health: await prisma.product.count({ where: { category: 'health' } }),
      cosmetic: await prisma.product.count({ where: { category: 'cosmetic' } })
    };

    console.log('\n📊 Database Statistics:');
    console.log(`  Total Products: ${stats.products}`);
    console.log(`  Health: ${stats.health}`);
    console.log(`  Cosmetic: ${stats.cosmetic}`);
    console.log(`  Total Tags: ${stats.tags}`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
