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

export interface ProductImage {
  productId: string;
  imageData: string; // base64 encoded
  thumbnailData: string; // base64 encoded thumbnail
  mimeType: string;
  sizeBytes: number;
  updatedAt: string;
}

class MyAppDatabase extends Dexie {
  products!: EntityTable<Product, 'id'>;
  drafts!: EntityTable<Draft, 'id'>;
  logs!: EntityTable<LogEntry, 'id'>;
  meta!: EntityTable<AppMeta, 'key'>;
  productImages!: EntityTable<ProductImage, 'productId'>;

  constructor() {
    super('MyAppDB');

    // Version 1: Initial schema
    this.version(1).stores({
      products: 'id, category, *tags, updatedAt, syncedAt',
      drafts: 'id, productId, updatedAt',
      logs: '++id, productId, action, timestamp',
      meta: 'key, updatedAt'
    });

    // Version 2: Add productImages table
    this.version(2).stores({
      products: 'id, category, *tags, updatedAt, syncedAt',
      drafts: 'id, productId, updatedAt',
      logs: '++id, productId, action, timestamp',
      meta: 'key, updatedAt',
      productImages: 'productId, updatedAt'
    });
  }

  async clearAll() {
    await this.transaction('rw', [this.products, this.drafts, this.logs, this.meta, this.productImages], async () => {
      await this.products.clear();
      await this.drafts.clear();
      await this.logs.clear();
      await this.meta.clear();
      await this.productImages.clear();
    });
  }

  async exportData() {
    return {
      version: 2,
      exportedAt: new Date().toISOString(),
      products: await this.products.toArray(),
      drafts: await this.drafts.toArray(),
      logs: await this.logs.toArray(),
      meta: await this.meta.toArray(),
      productImages: await this.productImages.toArray(),
    };
  }

  async importData(data: Awaited<ReturnType<typeof this.exportData>>) {
    await this.transaction('rw', [this.products, this.drafts, this.logs, this.meta, this.productImages], async () => {
      await this.clearAll();

      if (data.products?.length) await this.products.bulkAdd(data.products);
      if (data.drafts?.length) await this.drafts.bulkAdd(data.drafts);
      if (data.logs?.length) await this.logs.bulkAdd(data.logs);
      if (data.meta?.length) await this.meta.bulkAdd(data.meta);
      if (data.productImages?.length) await this.productImages.bulkAdd(data.productImages);
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

// Image management functions
export async function saveProductImage(productId: string, imageData: string, thumbnailData: string, mimeType: string, sizeBytes: number) {
  await db.productImages.put({
    productId,
    imageData,
    thumbnailData,
    mimeType,
    sizeBytes,
    updatedAt: new Date().toISOString(),
  });
}

export async function getProductImage(productId: string): Promise<ProductImage | undefined> {
  return db.productImages.get(productId);
}

export async function deleteProductImage(productId: string) {
  await db.productImages.delete(productId);
}

export async function getTotalImageSize(): Promise<number> {
  const images = await db.productImages.toArray();
  return images.reduce((total, img) => total + img.sizeBytes, 0);
}

export async function getImageCount(): Promise<number> {
  return db.productImages.count();
}
