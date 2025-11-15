/**
 * Script to query products from IndexedDB
 * Run with: npx tsx scripts/get-products.ts
 */

import Dexie from 'dexie';

interface Product {
  id: string;
  category: 'health' | 'cosmetic';
  pointValue: number;
  name: Record<string, string>;
  description: Record<string, string>;
  effects: Record<string, string>;
  sideEffects: Record<string, string>;
  goodFor: Record<string, string>;
  tags: string[];
  updatedAt: string;
  syncedAt?: string;
}

class MyAppDatabase extends Dexie {
  products!: Dexie.Table<Product, 'id'>;

  constructor() {
    super('MyAppDB');
    this.version(3).stores({
      products: 'id, category, *tags, updatedAt, syncedAt',
      drafts: 'id, productId, updatedAt',
      logs: '++id, productId, timestamp, category',
      meta: 'key, updatedAt',
    });
  }
}

async function getProducts() {
  const db = new MyAppDatabase();

  try {
    // Get all products
    const products = await db.products.toArray();

    console.log(`\n📦 Found ${products.length} products in database:\n`);

    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name.en || product.name.ja || 'Unnamed'}`);
      console.log(`   ID: ${product.id}`);
      console.log(`   Category: ${product.category}`);
      console.log(`   Points: ${product.pointValue}`);
      console.log(`   Languages: ${Object.keys(product.name).join(', ')}`);
      console.log(`   Tags: ${product.tags.join(', ') || 'none'}`);
      console.log('');
    });

    // Summary
    const healthProducts = products.filter(p => p.category === 'health').length;
    const cosmeticProducts = products.filter(p => p.category === 'cosmetic').length;

    console.log('📊 Summary:');
    console.log(`   Health products: ${healthProducts}`);
    console.log(`   Cosmetic products: ${cosmeticProducts}`);
    console.log(`   Total: ${products.length}`);

  } catch (error) {
    console.error('❌ Error querying database:', error);
  } finally {
    db.close();
  }
}

// Run the query
getProducts();
