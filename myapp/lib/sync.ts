/**
 * Sync System - Downloads bundle from Supabase Storage and updates IndexedDB
 * Uses ETag for efficient updates
 */

import { db, setMeta, getMeta, type Product } from './db';
import pako from 'pako';

const DEFAULT_BUNDLE_URL = process.env.NEXT_PUBLIC_BUNDLE_URL || '/api/bundle';

export interface SyncResult {
  success: boolean;
  updated: boolean;
  productCount?: number;
  error?: string;
  etag?: string;
}

interface BundleProduct {
  id: string;
  category: 'health' | 'cosmetic';
  pointValue: number;
  texts: Array<{
    language: string;
    name: string;
    description: string;
    effects: string;
    sideEffects: string;
    goodFor: string;
  }>;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface BundleData {
  products: BundleProduct[];
  schemaVersion?: string;
  [key: string]: unknown;
}

/**
 * Fetch and decompress the bundle
 */
async function fetchBundle(url: string, etag?: string): Promise<{ data: BundleData | null; newEtag?: string; notModified: boolean }> {
  const headers: HeadersInit = {};
  if (etag) {
    headers['If-None-Match'] = etag;
  }

  const response = await fetch(url, { headers });

  if (response.status === 304) {
    return { data: null, notModified: true };
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch bundle: ${response.status}`);
  }

  const newEtag = response.headers.get('etag') || undefined;
  const arrayBuffer = await response.arrayBuffer();

  // Decompress gzip
  const decompressed = pako.ungzip(new Uint8Array(arrayBuffer), { to: 'string' });
  const data = JSON.parse(decompressed);

  return { data, newEtag, notModified: false };
}

/**
 * Main sync function - downloads bundle and updates local database atomically
 */
export async function syncNow(): Promise<SyncResult> {
  try {
    const bundleUrl = ((await getMeta('bundleUrl')) as string) || DEFAULT_BUNDLE_URL;
    const storedEtag = (await getMeta('lastEtag')) as string | null;

    const { data, newEtag, notModified } = await fetchBundle(bundleUrl, storedEtag || undefined);

    if (notModified) {
      return {
        success: true,
        updated: false,
        productCount: await db.products.count(),
        etag: storedEtag || undefined,
      };
    }

    // Validate bundle structure
    if (!data || !data.products || !Array.isArray(data.products)) {
      throw new Error('Invalid bundle structure');
    }

    // Transform bundle products to MyApp format
    const products: Product[] = data.products.map(bundleProduct => {
      // Convert texts array to language-keyed objects
      const name: Record<string, string> = {};
      const description: Record<string, string> = {};
      const effects: Record<string, string> = {};
      const sideEffects: Record<string, string> = {};
      const goodFor: Record<string, string> = {};

      bundleProduct.texts.forEach(text => {
        name[text.language] = text.name;
        description[text.language] = text.description;
        effects[text.language] = text.effects;
        sideEffects[text.language] = text.sideEffects;
        goodFor[text.language] = text.goodFor;
      });

      return {
        id: bundleProduct.id,
        category: bundleProduct.category,
        pointValue: bundleProduct.pointValue,
        name,
        description,
        effects,
        sideEffects,
        goodFor,
        tags: bundleProduct.tags,
        updatedAt: bundleProduct.updatedAt,
      };
    });

    // Atomic replace - clear and insert in transaction
    await db.transaction('rw', db.products, async () => {
      await db.products.clear();

      const now = new Date().toISOString();
      const productsWithSync = products.map(p => ({
        ...p,
        syncedAt: now,
      }));

      await db.products.bulkAdd(productsWithSync);
    });

    // Update metadata
    await setMeta('lastSync', new Date().toISOString());
    if (newEtag) {
      await setMeta('lastEtag', newEtag);
    }
    if (data.schemaVersion) {
      await setMeta('schemaVersion', data.schemaVersion);
    }

    return {
      success: true,
      updated: true,
      productCount: products.length,
      etag: newEtag,
    };

  } catch (error) {
    console.error('Sync error:', error);
    return {
      success: false,
      updated: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Auto-sync on app open if bundle URL is configured
 */
export async function autoSync(): Promise<SyncResult | null> {
  const autoSyncEnabled = await getMeta('autoSyncEnabled');

  if (autoSyncEnabled === false) {
    return null;
  }

  const lastSync = (await getMeta('lastSync')) as string | null;
  const now = Date.now();

  // Auto-sync if never synced or last sync was > 1 hour ago
  if (!lastSync || now - new Date(lastSync).getTime() > 3600000) {
    return syncNow();
  }

  return null;
}

/**
 * Check if sync is available (bundle URL configured)
 */
export async function isSyncAvailable(): Promise<boolean> {
  const bundleUrl = (await getMeta('bundleUrl')) as string;
  return !!bundleUrl || !!DEFAULT_BUNDLE_URL;
}

/**
 * Get sync status
 */
export async function getSyncStatus() {
  const lastSync = (await getMeta('lastSync')) as string | null;
  const lastEtag = (await getMeta('lastEtag')) as string | null;
  const productCount = await db.products.count();

  return {
    lastSync,
    lastEtag,
    productCount,
    hasData: productCount > 0,
  };
}
