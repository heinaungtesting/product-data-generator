#!/usr/bin/env tsx

/**
 * SQLite to Supabase Migration Script
 *
 * This script migrates all data from the local SQLite database to Supabase:
 * - Products
 * - Product texts (multi-language)
 * - Tags
 * - Product-tag relationships
 *
 * Usage:
 *   tsx scripts/migrate-to-supabase.ts
 *
 * Prerequisites:
 * - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 * - Supabase migrations applied
 * - Existing SQLite database at prisma/dev.db
 */

import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials!');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const prisma = new PrismaClient();
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface MigrationStats {
  products: number;
  productTexts: number;
  tags: number;
  productTags: number;
  errors: string[];
}

const stats: MigrationStats = {
  products: 0,
  productTexts: 0,
  tags: 0,
  productTags: 0,
  errors: [],
};

/**
 * Create backup of SQLite database
 */
async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `backup/sqlite-backup-${timestamp}.db`;

  try {
    const fs = await import('fs/promises');
    await fs.mkdir('backup', { recursive: true });
    await fs.copyFile('prisma/dev.db', backupPath);
    console.log(`✅ Backup created: ${backupPath}`);
    return backupPath;
  } catch (error) {
    console.error('❌ Failed to create backup:', error);
    throw error;
  }
}

/**
 * Check if Supabase tables exist
 */
async function checkSupabaseTables() {
  console.log('\n🔍 Checking Supabase tables...');

  const tables = ['products', 'product_texts', 'tags', 'product_tags', 'staff', 'point_logs'];

  for (const table of tables) {
    const { error } = await supabase.from(table).select('id').limit(1);

    if (error && error.code === '42P01') {
      console.error(`❌ Table "${table}" does not exist!`);
      console.error('Please run Supabase migrations first:');
      console.error('  npx supabase db push');
      process.exit(1);
    }
  }

  console.log('✅ All required tables exist');
}

/**
 * Migrate tags first (needed for product-tag relationships)
 */
async function migrateTags() {
  console.log('\n📦 Migrating tags...');

  const sqliteTags = await prisma.tag.findMany();

  if (sqliteTags.length === 0) {
    console.log('⚠️  No tags found in SQLite');
    return new Map<number, number>();
  }

  // Map old SQLite tag IDs to new Supabase tag IDs
  const tagIdMap = new Map<number, number>();

  for (const tag of sqliteTags) {
    try {
      // Upsert tag (in case it already exists)
      const { data, error } = await supabase
        .from('tags')
        .upsert({ name: tag.name }, { onConflict: 'name' })
        .select('id')
        .single();

      if (error) {
        stats.errors.push(`Tag "${tag.name}": ${error.message}`);
        continue;
      }

      if (data) {
        tagIdMap.set(tag.id, data.id);
        stats.tags++;
      }
    } catch (error) {
      stats.errors.push(`Tag "${tag.name}": ${error}`);
    }
  }

  console.log(`✅ Migrated ${stats.tags} tags`);
  return tagIdMap;
}

/**
 * Migrate products with their texts and tags
 */
async function migrateProducts(tagIdMap: Map<number, number>) {
  console.log('\n📦 Migrating products...');

  const sqliteProducts = await prisma.product.findMany({
    include: {
      texts: true,
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });

  if (sqliteProducts.length === 0) {
    console.log('⚠️  No products found in SQLite');
    return;
  }

  console.log(`Found ${sqliteProducts.length} products to migrate`);

  for (const product of sqliteProducts) {
    try {
      // 1. Insert product
      const { data: supabaseProduct, error: productError } = await supabase
        .from('products')
        .upsert({
          id: product.id,
          category: product.category,
          point_value: product.pointValue,
          content_updated_at: product.contentUpdatedAt.toISOString(),
          created_at: product.createdAt.toISOString(),
          updated_at: product.updatedAt.toISOString(),
        }, { onConflict: 'id' })
        .select()
        .single();

      if (productError) {
        stats.errors.push(`Product ${product.id}: ${productError.message}`);
        continue;
      }

      stats.products++;

      // 2. Insert product texts (translations)
      for (const text of product.texts) {
        const { error: textError } = await supabase
          .from('product_texts')
          .upsert({
            product_id: product.id,
            language: text.language,
            name: text.name,
            description: text.description || '',
            effects: text.effects || '',
            side_effects: text.sideEffects || '',
            good_for: text.goodFor || '',
          }, { onConflict: 'product_id,language' });

        if (textError) {
          stats.errors.push(`Product text ${product.id} (${text.language}): ${textError.message}`);
        } else {
          stats.productTexts++;
        }
      }

      // 3. Insert product-tag relationships
      for (const { tag } of product.tags) {
        const supabaseTagId = tagIdMap.get(tag.id);

        if (!supabaseTagId) {
          stats.errors.push(`Product ${product.id}: Tag ${tag.name} not found in Supabase`);
          continue;
        }

        const { error: tagError } = await supabase
          .from('product_tags')
          .upsert({
            product_id: product.id,
            tag_id: supabaseTagId,
          }, { onConflict: 'product_id,tag_id' });

        if (tagError) {
          stats.errors.push(`Product-tag ${product.id}-${tag.name}: ${tagError.message}`);
        } else {
          stats.productTags++;
        }
      }

      // Progress indicator
      if (stats.products % 10 === 0) {
        console.log(`  Migrated ${stats.products} products...`);
      }
    } catch (error) {
      stats.errors.push(`Product ${product.id}: ${error}`);
    }
  }

  console.log(`✅ Migrated ${stats.products} products`);
}

/**
 * Verify migration
 */
async function verifyMigration() {
  console.log('\n🔍 Verifying migration...');

  // Count products in SQLite
  const sqliteProductCount = await prisma.product.count();

  // Count products in Supabase
  const { count: supabaseProductCount, error } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('❌ Failed to verify migration:', error.message);
    return false;
  }

  console.log(`SQLite products: ${sqliteProductCount}`);
  console.log(`Supabase products: ${supabaseProductCount}`);

  if (sqliteProductCount === supabaseProductCount) {
    console.log('✅ Product counts match!');
    return true;
  } else {
    console.error('❌ Product counts do not match!');
    return false;
  }
}

/**
 * Print migration summary
 */
function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Products migrated:       ${stats.products}`);
  console.log(`Product texts migrated:  ${stats.productTexts}`);
  console.log(`Tags migrated:           ${stats.tags}`);
  console.log(`Product-tags migrated:   ${stats.productTags}`);
  console.log(`Errors:                  ${stats.errors.length}`);

  if (stats.errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    stats.errors.forEach((error, i) => {
      console.log(`  ${i + 1}. ${error}`);
    });
  }

  console.log('='.repeat(60));
}

/**
 * Main migration function
 */
async function main() {
  console.log('🚀 Starting SQLite to Supabase migration...\n');
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log(`Service Key: ${supabaseServiceKey.substring(0, 20)}...`);

  try {
    // Step 1: Create backup
    await createBackup();

    // Step 2: Check Supabase tables
    await checkSupabaseTables();

    // Step 3: Migrate tags first
    const tagIdMap = await migrateTags();

    // Step 4: Migrate products
    await migrateProducts(tagIdMap);

    // Step 5: Verify migration
    const verified = await verifyMigration();

    // Step 6: Print summary
    printSummary();

    if (verified && stats.errors.length === 0) {
      console.log('\n✅ Migration completed successfully!');
      console.log('\n📝 Next steps:');
      console.log('  1. Verify data in Supabase dashboard');
      console.log('  2. Test API routes with Supabase');
      console.log('  3. Keep SQLite backup for safety');
      console.log('  4. Once verified, you can remove Prisma dependencies');
    } else {
      console.log('\n⚠️  Migration completed with issues');
      console.log('Please review errors above and fix manually if needed');
    }
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
main().catch(console.error);
