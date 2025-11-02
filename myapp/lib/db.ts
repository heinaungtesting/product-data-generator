/**
 * IndexedDB Database Layer using Dexie
 * Stores products, drafts, logs, and metadata offline
 */

import Dexie, { type EntityTable } from 'dexie';

export interface Product {
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

export interface Draft {
  id: string;
  productId: string;
  data: Partial<Product>;
  updatedAt: string;
  snapshotStack: Array<Partial<Product>>;
}

export interface LogEntry {
  id?: number;
  productId: string;
  productName: string;
  action: 'view' | 'edit' | 'compare';
  timestamp: string;
  notes?: string;
}

export interface AppMeta {
  key: string;
  value: string | number | boolean;
  updatedAt: string;
}

class MyAppDatabase extends Dexie {
  products!: EntityTable<Product, 'id'>;
  drafts!: EntityTable<Draft, 'id'>;
  logs!: EntityTable<LogEntry, 'id'>;
  meta!: EntityTable<AppMeta, 'key'>;

  constructor() {
    super('MyAppDB');

    this.version(1).stores({
      products: 'id, category, *tags, updatedAt, syncedAt',
      drafts: 'id, productId, updatedAt',
      logs: '++id, productId, action, timestamp',
      meta: 'key, updatedAt'
    });
  }

  async clearAll() {
    await this.transaction('rw', [this.products, this.drafts, this.logs, this.meta], async () => {
      await this.products.clear();
      await this.drafts.clear();
      await this.logs.clear();
      await this.meta.clear();
    });
  }

  async exportData() {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      products: await this.products.toArray(),
      drafts: await this.drafts.toArray(),
      logs: await this.logs.toArray(),
      meta: await this.meta.toArray(),
    };
  }

  async importData(data: Awaited<ReturnType<typeof this.exportData>>) {
    await this.transaction('rw', [this.products, this.drafts, this.logs, this.meta], async () => {
      await this.clearAll();

      if (data.products?.length) await this.products.bulkAdd(data.products);
      if (data.drafts?.length) await this.drafts.bulkAdd(data.drafts);
      if (data.logs?.length) await this.logs.bulkAdd(data.logs);
      if (data.meta?.length) await this.meta.bulkAdd(data.meta);
    });
  }
}

export const db = new MyAppDatabase();

// Helper functions
export async function getMeta(key: string): Promise<string | number | boolean | null> {
  const item = await db.meta.get(key);
  return item?.value ?? null;
}

export async function setMeta(key: string, value: string | number | boolean) {
  await db.meta.put({ key, value, updatedAt: new Date().toISOString() });
}

export async function getProductCount(): Promise<number> {
  return db.products.count();
}

export async function searchProducts(query: string, lang: string = 'en'): Promise<Product[]> {
  const lowerQuery = query.toLowerCase();

  return db.products
    .filter(product => {
      const name = product.name[lang]?.toLowerCase() || '';
      const desc = product.description[lang]?.toLowerCase() || '';
      const effects = product.effects[lang]?.toLowerCase() || '';

      return name.includes(lowerQuery) ||
             desc.includes(lowerQuery) ||
             effects.includes(lowerQuery) ||
             product.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
    })
    .toArray();
}
