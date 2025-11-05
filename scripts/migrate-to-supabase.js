#!/usr/bin/env node

/**
 * Migration Script: SQLite/Prisma → Supabase
 *
 * Reads data from the existing Prisma database and migrates it to Supabase.
 * This is a one-time migration script for transitioning from the old system.
 *
 * Usage:
 *   node scripts/migrate-to-supabase.js
 *
 * Prerequisites:
 *   - Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment
 *   - Run Supabase migrations first: supabase db push
 *   - Ensure prisma/dev.db exists with data
 */

import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

// Check environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  console.error('');
  console.error('Example:');
  console.error('  export SUPABASE_URL=https://your-project.supabase.co');
  console.error('  export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  console.error('  node scripts/migrate-to-supabase.js');
  process.exit(1);
}

// Initialize clients
const prisma = new PrismaClient();
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Migrate products and their related data
 */
async function migrateProducts() {
  console.log('📦 Fetching products from SQLite...');

  const products = await prisma.product.findMany({
    include: {
      texts: true,
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });

  console.log(`Found ${products.length} products to migrate`);

  if (products.length === 0) {
    console.log('⚠️  No products found in SQLite database');
    return { products: 0, texts: 0, tags: 0 };
  }

  let migratedProducts = 0;
  let migratedTexts = 0;
  let migratedTags = 0;
  const allTags = new Set();

  for (const product of products) {
    console.log(`\n  Migrating: ${product.id} (${product.category})`);

    // Insert product
    const { error: productError } = await supabase
      .from('products')
      .insert({
        id: product.id,
        category: product.category,
        jan_code: null, // SQLite schema doesn't have JAN code
        barcode: null,
        updated_at: product.updatedAt.toISOString(),
        created_at: product.createdAt.toISOString(),
      });

    if (productError) {
      if (productError.code === '23505') { // Duplicate key
        console.log(`    ⚠️  Product ${product.id} already exists, skipping`);
        continue;
      }
      console.error(`    ❌ Failed to insert product ${product.id}:`, productError.message);
      continue;
    }

    migratedProducts++;

    // Insert product texts
    for (const text of product.texts) {
      const { error: textError } = await supabase
        .from('product_texts')
        .insert({
          product_id: product.id,
          lang: text.language,
          name: text.name,
          description: text.description,
          features: text.effects ? JSON.stringify([text.effects]) : null,
          usage: text.goodFor || null,
          ingredients: null,
          warnings: text.sideEffects || null,
        });

      if (textError) {
        console.error(`    ❌ Failed to insert text (${text.language}):`, textError.message);
      } else {
        migratedTexts++;
      }
    }

    // Collect unique tags
    product.tags.forEach(pt => allTags.add(pt.tag.name));

    // Insert tags for this product
    for (const productTag of product.tags) {
      const tagName = productTag.tag.name;

      // Ensure tag exists
      const { error: tagError } = await supabase
        .from('tags')
        .insert({ id: tagName })
        .select()
        .single();

      if (tagError && tagError.code !== '23505') { // Ignore duplicate key errors
        console.error(`    ⚠️  Failed to create tag ${tagName}:`, tagError.message);
      }

      // Link tag to product
      const { error: linkError } = await supabase
        .from('product_tags')
        .insert({
          product_id: product.id,
          tag_id: tagName,
        });

      if (linkError && linkError.code !== '23505') {
        console.error(`    ⚠️  Failed to link tag ${tagName}:`, linkError.message);
      } else if (!linkError) {
        migratedTags++;
      }
    }

    console.log(`    ✅ Migrated with ${product.texts.length} texts and ${product.tags.length} tags`);
  }

  return {
    products: migratedProducts,
    texts: migratedTexts,
    tags: migratedTags,
  };
}

/**
 * Verify migration by comparing counts
 */
async function verifyMigration() {
  console.log('\n🔍 Verifying migration...');

  // Count in SQLite
  const sqliteCount = await prisma.product.count();

  // Count in Supabase
  const { count: supabaseCount, error } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('❌ Failed to verify:', error.message);
    return false;
  }

  console.log(`\n  SQLite:   ${sqliteCount} products`);
  console.log(`  Supabase: ${supabaseCount} products`);

  if (sqliteCount === supabaseCount) {
    console.log('\n  ✅ Product counts match!');
    return true;
  } else {
    console.log('\n  ⚠️  Product counts differ - some products may not have migrated');
    return false;
  }
}

/**
 * Trigger bundle generation after migration
 */
async function triggerBundleGeneration() {
  console.log('\n📦 Triggering bundle generation...');

  const { data, error } = await supabase.functions.invoke('generate-bundle', {
    body: { trigger: 'migration' },
  });

  if (error) {
    console.error('❌ Failed to generate bundle:', error.message);
    console.error('   You can manually trigger it later with:');
    console.error('   supabase functions invoke generate-bundle');
    return false;
  }

  console.log(`✅ Bundle generated successfully!`);
  console.log(`   Products: ${data.productCount}`);
  console.log(`   Size: ${data.sizeBytes} bytes`);
  console.log(`   URL: ${data.url}`);

  return true;
}

/**
 * Main migration function
 */
async function main() {
  console.log('🚀 Starting migration from SQLite to Supabase...\n');

  try {
    // Step 1: Migrate products
    const stats = await migrateProducts();

    console.log('\n\n📊 Migration Summary:');
    console.log(`  ✅ Products:      ${stats.products}`);
    console.log(`  ✅ Texts:         ${stats.texts}`);
    console.log(`  ✅ Tag Links:     ${stats.tags}`);

    // Step 2: Verify migration
    await verifyMigration();

    // Step 3: Generate bundle
    await triggerBundleGeneration();

    console.log('\n\n🎉 Migration complete!');
    console.log('\nNext steps:');
    console.log('  1. Update your MCP server config to use the Supabase server');
    console.log('  2. Update NEXT_PUBLIC_BUNDLE_URL in myapp/.env.local');
    console.log('  3. Test adding a product via Claude Desktop');
    console.log('  4. Verify MyApp syncs the new bundle');

  } catch (error) {
    console.error('\n\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
main().catch(console.error);
