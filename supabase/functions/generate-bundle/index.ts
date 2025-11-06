/**
 * Supabase Edge Function: Generate Bundle
 *
 * Automatically generates and uploads product bundle to Supabase Storage
 * Triggered by database changes or manual API calls
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { gzip } from 'https://deno.land/x/compress@v0.4.5/mod.ts';
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts';

const SCHEMA_VERSION = '1.0.0';

interface Product {
  id: string;
  category: string;
  janCode: string | null;
  barcode: string | null;
  texts: ProductText[];
  tags: string[];
  updatedAt: string;
  syncedAt: string | null;
}

interface ProductText {
  lang: string;
  name: string;
  description: string | null;
  features: string[] | null;
  usage: string | null;
  ingredients: string | null;
  warnings: string | null;
}

interface PurchaseLogEntry {
  productId: string;
  timestamp: string;
  [key: string]: unknown;
}

interface Bundle {
  schemaVersion: string;
  builtAt: string;
  productCount: number;
  products: Product[];
  purchaseLog: PurchaseLogEntry[];
}

interface DatabaseRow {
  id: string;
  category: string;
  jan_code: string | null;
  barcode: string | null;
  product_texts?: Array<{
    lang: string;
    name: string;
    description: string | null;
    features: string | null;
    usage: string | null;
    ingredients: string | null;
    warnings: string | null;
  }>;
  product_tags?: Array<{ tags: { id: string } }>;
  updated_at: string;
  synced_at: string | null;
}

/**
 * Transform database row to bundle product format
 */
function transformProduct(row: DatabaseRow): Product {
  return {
    id: row.id,
    category: row.category,
    janCode: row.jan_code,
    barcode: row.barcode,
    texts: row.product_texts?.map((t) => ({
      lang: t.lang,
      name: t.name,
      description: t.description,
      features: t.features ? JSON.parse(t.features) : null,
      usage: t.usage,
      ingredients: t.ingredients,
      warnings: t.warnings,
    })) || [],
    tags: row.product_tags?.map((pt) => pt.tags.id) || [],
    updatedAt: row.updated_at,
    syncedAt: row.synced_at,
  };
}

/**
 * Generate ETag hash from bundle content
 */
async function generateETag(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.substring(0, 16);
}

/**
 * Compress data using gzip
 */
function compressData(data: Uint8Array): Uint8Array {
  return gzip(data);
}

serve(async (_req) => {
  try {
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting bundle generation...');

    // Fetch all products with their texts and tags
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select(`
        *,
        product_texts (*),
        product_tags (
          tags (id)
        )
      `)
      .order('updated_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching products:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch products', details: fetchError }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Transform products to bundle format
    const transformedProducts = products?.map(transformProduct) || [];

    // Create bundle object
    const bundle: Bundle = {
      schemaVersion: SCHEMA_VERSION,
      builtAt: new Date().toISOString(),
      productCount: transformedProducts.length,
      products: transformedProducts,
      purchaseLog: [], // Empty for now, can be populated later
    };

    // Convert to JSON
    const bundleJson = JSON.stringify(bundle, null, 0);

    // Generate ETag
    const etag = await generateETag(bundleJson);

    // Compress bundle
    const encoder = new TextEncoder();
    const bundleBytes = encoder.encode(bundleJson);
    const compressed = compressData(bundleBytes);

    console.log(`Bundle created: ${transformedProducts.length} products, ${compressed.length} bytes (compressed)`);

    // Upload to Supabase Storage
    const storagePath = 'bundle.json.gz';
    const { error: uploadError } = await supabase.storage
      .from('bundles')
      .upload(storagePath, compressed, {
        contentType: 'application/gzip',
        cacheControl: '3600',
        upsert: true, // Overwrite existing file
      });

    if (uploadError) {
      console.error('Error uploading bundle:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to upload bundle', details: uploadError }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('bundles')
      .getPublicUrl(storagePath);

    // Save bundle metadata
    const { error: metadataError } = await supabase
      .from('bundle_metadata')
      .insert({
        etag,
        product_count: transformedProducts.length,
        built_at: bundle.builtAt,
        storage_path: storagePath,
        size_bytes: compressed.length,
        schema_version: SCHEMA_VERSION,
      });

    if (metadataError) {
      console.warn('Error saving bundle metadata:', metadataError);
      // Don't fail the request if metadata save fails
    }

    // Update synced_at timestamp for all products
    const productIds = transformedProducts.map(p => p.id);
    if (productIds.length > 0) {
      await supabase
        .from('products')
        .update({ synced_at: bundle.builtAt })
        .in('id', productIds);
    }

    console.log('Bundle generation complete!');

    return new Response(
      JSON.stringify({
        success: true,
        etag,
        productCount: transformedProducts.length,
        sizeBytes: compressed.length,
        url: urlData.publicUrl,
        builtAt: bundle.builtAt,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
