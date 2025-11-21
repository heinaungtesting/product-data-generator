/**
 * Sync Web Worker - Handles heavy sync operations off the main thread
 *
 * This worker performs:
 * - Fetching the gzip bundle from Supabase
 * - Pako decompression (CPU intensive)
 * - JSON parsing (can block on large payloads)
 * - Data transformation to app format
 *
 * The main thread remains responsive while this worker runs.
 */

import pako from 'pako';

// Types for bundle data
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

// Transformed product type matching the app's Product interface
interface TransformedProduct {
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
  syncedAt: string;
}

export interface WorkerSyncResult {
  success: boolean;
  updated: boolean;
  products?: TransformedProduct[];
  productCount?: number;
  error?: string;
  newEtag?: string;
  schemaVersion?: string;
  notModified?: boolean;
}

export interface WorkerSyncRequest {
  type: 'sync';
  bundleUrl: string;
  etag?: string;
}

/**
 * Fetch and decompress the bundle (heavy operation)
 */
async function fetchAndDecompressBundle(
  url: string,
  etag?: string
): Promise<{ data: BundleData | null; newEtag?: string; notModified: boolean }> {
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

  // Heavy operation: Decompress gzip (runs in worker, not blocking main thread)
  const decompressed = pako.ungzip(new Uint8Array(arrayBuffer), { to: 'string' });

  // Heavy operation: Parse large JSON (runs in worker, not blocking main thread)
  const data = JSON.parse(decompressed);

  return { data, newEtag, notModified: false };
}

/**
 * Transform bundle products to app format (CPU intensive for large datasets)
 */
function transformProducts(bundleProducts: BundleProduct[]): TransformedProduct[] {
  const now = new Date().toISOString();

  return bundleProducts.map(bundleProduct => {
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

    // Normalize tags
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

    // Derive point value
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
      updatedAt: bundleProduct.updatedAt ?? bundleProduct.updated_at ?? now,
      syncedAt: now,
    };
  });
}

/**
 * Handle sync request from main thread
 */
async function handleSync(request: WorkerSyncRequest): Promise<WorkerSyncResult> {
  try {
    const { bundleUrl, etag } = request;

    if (!bundleUrl) {
      throw new Error('No bundle URL configured');
    }

    console.log('[SyncWorker] Starting sync from:', bundleUrl);

    // Fetch and decompress (heavy operations in worker)
    const { data, newEtag, notModified } = await fetchAndDecompressBundle(bundleUrl, etag);

    if (notModified) {
      console.log('[SyncWorker] Bundle unchanged (304)');
      return {
        success: true,
        updated: false,
        notModified: true,
      };
    }

    // Validate bundle structure
    if (!data || !data.products || !Array.isArray(data.products)) {
      throw new Error('Invalid bundle structure - missing products array');
    }

    console.log(`[SyncWorker] Transforming ${data.products.length} products...`);

    // Transform products (CPU intensive, runs in worker)
    const products = transformProducts(data.products);

    console.log(`[SyncWorker] Sync complete: ${products.length} products transformed`);

    return {
      success: true,
      updated: true,
      products,
      productCount: products.length,
      newEtag,
      schemaVersion: data.schemaVersion,
    };

  } catch (error) {
    console.error('[SyncWorker] Error:', error);

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

// Web Worker message handler
self.onmessage = async (event: MessageEvent<WorkerSyncRequest>) => {
  const request = event.data;

  if (request.type === 'sync') {
    const result = await handleSync(request);
    self.postMessage(result);
  }
};

// Export for TypeScript
export {};
