/**
 * Sync System - Downloads bundle from Supabase Storage and updates IndexedDB
 * Uses ETag for efficient updates
 */

import { db, setMeta, getMeta, type Product } from './db';
import pako from 'pako';

// Fallback bundle URL - can be overridden in settings or via environment variable
const FALLBACK_BUNDLE_URL = 'https://hqztadklpalhrukkrppg.supabase.co/storage/v1/object/public/bundles/bundle.json.gz';

const ENV_BUNDLE_URL =
  process.env.NEXT_PUBLIC_BUNDLE_URL ||
  process.env.SUPABASE_BUNDLE_URL ||
  FALLBACK_BUNDLE_URL;

const DEFAULT_BUNDLE_URL = ENV_BUNDLE_URL;

export interface SyncResult {
  success: boolean;
  updated: boolean;
  productCount?: number;
  error?: string;
  etag?: string;
}

type RawTextEntry = {
  language?: string;
  lang?: string;
  name?: string;
  description?: string;
  effects?: string;
  sideEffects?: string;
  side_effects?: string;
  goodFor?: string;
  good_for?: string;
};

type RawTagEntry = string | { id?: string } | { tag_id?: string } | null | undefined;

interface BundleProduct {
  id: string;
  category: 'health' | 'cosmetic';
  pointValue?: number;
  point_value?: number;
  texts?: RawTextEntry[];
  tags?: RawTagEntry[];
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
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
    const storedUrl = (await getMeta('bundleUrl')) as string | null;
    const bundleUrl = storedUrl || DEFAULT_BUNDLE_URL;

    console.log('🔍 Bundle URL check:', {
      storedUrl,
      DEFAULT_BUNDLE_URL,
      finalUrl: bundleUrl,
      envVar: process.env.NEXT_PUBLIC_BUNDLE_URL,
    });

    if (!bundleUrl) {
      throw new Error('No bundle URL configured. Please check your environment variables or settings.');
    }

    console.log('🔄 Starting sync from:', bundleUrl);

    const storedEtag = (await getMeta('lastEtag')) as string | null;

    const { data, newEtag, notModified } = await fetchBundle(bundleUrl, storedEtag || undefined);

    if (notModified) {
      console.log('✅ Bundle unchanged (304), skipping sync');
      return {
        success: true,
        updated: false,
        productCount: await db.products.count(),
        etag: storedEtag || undefined,
      };
    }

    // Validate bundle structure
    if (!data || !data.products || !Array.isArray(data.products)) {
      throw new Error('Invalid bundle structure - missing products array');
    }

    console.log(`📦 Syncing ${data.products.length} products...`);

    // Transform bundle products to MyApp format
    const products: Product[] = data.products.map(bundleProduct => {
      const texts = bundleProduct.texts ?? [];
      // Convert texts array to language-keyed objects
      const name: Record<string, string> = {};
      const description: Record<string, string> = {};
      const effects: Record<string, string> = {};
      const sideEffects: Record<string, string> = {};
      const goodFor: Record<string, string> = {};

      texts.forEach(text => {
        const languageKey = text.language || text.lang || 'en';

        if (text.name) {
          name[languageKey] = text.name;
        }
        if (text.description) {
          description[languageKey] = text.description;
        }
        if (text.effects) {
          effects[languageKey] = text.effects;
        }
        if (text.sideEffects || text.side_effects) {
          sideEffects[languageKey] = text.sideEffects ?? text.side_effects ?? '';
        }
        if (text.goodFor || text.good_for) {
          goodFor[languageKey] = text.goodFor ?? text.good_for ?? '';
        }
      });

      const tags =
        (bundleProduct.tags ?? [])
          .map(tag => {
            if (!tag) return null;
            if (typeof tag === 'string') return tag;
            if ('id' in tag && tag.id) return tag.id;
            if ('tag_id' in tag && tag.tag_id) return tag.tag_id;
            return null;
          })
          .filter((tag): tag is string => Boolean(tag)) ?? [];

      const derivedPoint =
        typeof bundleProduct.pointValue === 'number'
          ? bundleProduct.pointValue
          : typeof bundleProduct.point_value === 'number'
          ? bundleProduct.point_value
          : (() => {
              const match = String(bundleProduct.id).match(/(\d+)(?!.*\d)/);
              return match ? Number(match[1]) : null;
            })() ?? 0;

      return {
        id: bundleProduct.id,
        category: bundleProduct.category,
        pointValue: derivedPoint,
        name,
        description,
        effects,
        sideEffects,
        goodFor,
        tags,
        updatedAt: bundleProduct.updatedAt ?? bundleProduct.updated_at ?? new Date().toISOString(),
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

    console.log(`✅ Sync complete: ${products.length} products synced`);

    return {
      success: true,
      updated: true,
      productCount: products.length,
      etag: newEtag,
    };

  } catch (error) {
    console.error('❌ Sync error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown sync error occurred';

    // Provide more helpful error messages
    let userFriendlyError = errorMessage;
    if (errorMessage.includes('Failed to fetch')) {
      userFriendlyError = 'Network error: Unable to connect to server. Check your internet connection.';
    } else if (errorMessage.includes('Invalid bundle')) {
      userFriendlyError = 'Bundle format error: The data format is invalid or corrupted.';
    } else if (errorMessage.includes('No bundle URL')) {
      userFriendlyError = 'Configuration error: Bundle URL not configured.';
    }

    return {
      success: false,
      updated: false,
      error: userFriendlyError,
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
