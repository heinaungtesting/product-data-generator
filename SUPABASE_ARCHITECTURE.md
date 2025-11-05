# Supabase Architecture for MCP Bundle Automation

## 🎯 Overview

Replace git-based workflow with Supabase for real-time, automatic bundle generation and distribution.

**Key Benefits:**
- ✅ No git commits for data changes
- ✅ Real-time bundle updates
- ✅ Automatic bundle generation via Database Triggers
- ✅ Multiple users can add products simultaneously
- ✅ Centralized cloud database
- ✅ Built-in API & Storage
- ✅ No GitHub Actions needed

---

## 📊 Architecture Comparison

### Current Architecture (Git-Based)
```
MCP adds product
    ↓
prisma/dev.db (local SQLite)
    ↓
./sync-bundle.sh OR GitHub Actions
    ↓
dist/bundle.json.gz generated
    ↓
Copy to myapp/public/bundle.json.gz
    ↓
git add, commit, push
    ↓
Vercel deploys
    ↓
MyApp fetches /api/bundle
```

**Problems:**
- ❌ Manual script execution or complex GitHub Actions
- ❌ Git history polluted with bundle commits
- ❌ Slow (git push → deploy cycle)
- ❌ Single-user (local database)
- ❌ Complex automation

### Proposed Architecture (Supabase)
```
MCP adds product via Supabase API
    ↓
Supabase PostgreSQL (cloud)
    ↓
Database Trigger fires automatically
    ↓
Edge Function generates bundle
    ↓
Bundle saved to Supabase Storage
    ↓
MyApp fetches directly from Supabase Storage
```

**Benefits:**
- ✅ Fully automatic (no manual steps)
- ✅ Real-time (< 1 second)
- ✅ Multi-user support
- ✅ No git pollution
- ✅ Simple architecture
- ✅ Cost: $0/month (free tier)

---

## 🏗️ Implementation Plan

### Phase 1: Supabase Setup

#### 1.1 Create Supabase Project
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Initialize project
supabase init

# Link to cloud project
supabase link --project-ref your-project-ref
```

#### 1.2 Database Schema (PostgreSQL)
```sql
-- Create products table
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('health', 'cosmetic')),
  point_value INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create product_texts table
CREATE TABLE product_texts (
  id SERIAL PRIMARY KEY,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  language TEXT NOT NULL CHECK (language IN ('ja', 'en', 'zh', 'th', 'ko')),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  effects TEXT,
  side_effects TEXT,
  good_for TEXT,
  UNIQUE(product_id, language)
);

-- Create tags table
CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

-- Create product_tags junction table
CREATE TABLE product_tags (
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, tag_id)
);

-- Create bundle_metadata table
CREATE TABLE bundle_metadata (
  id SERIAL PRIMARY KEY,
  etag TEXT NOT NULL,
  product_count INTEGER NOT NULL,
  size_bytes INTEGER NOT NULL,
  built_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_products_updated ON products(updated_at DESC);
CREATE INDEX idx_product_texts_product ON product_texts(product_id);
CREATE INDEX idx_product_tags_product ON product_tags(product_id);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

#### 1.3 Row Level Security (RLS)
```sql
-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_texts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_metadata ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access
CREATE POLICY "Allow authenticated full access" ON products
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated full access" ON product_texts
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated full access" ON tags
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated full access" ON product_tags
  FOR ALL TO authenticated USING (true);

-- Allow anonymous read-only access (for MyApp bundle fetch)
CREATE POLICY "Allow anonymous read" ON products
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous read" ON product_texts
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous read" ON tags
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous read" ON product_tags
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous read" ON bundle_metadata
  FOR SELECT TO anon USING (true);
```

### Phase 2: Edge Function for Bundle Generation

#### 2.1 Create Edge Function
```bash
supabase functions new generate-bundle
```

#### 2.2 Edge Function Code (`supabase/functions/generate-bundle/index.ts`)
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { gzip } from 'https://deno.land/x/compress@v0.4.5/gzip/gzip.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    console.log('Fetching products from database...')

    // Fetch all products with their texts and tags
    const { data: products, error: productsError } = await supabaseClient
      .from('products')
      .select(`
        id,
        category,
        point_value,
        created_at,
        updated_at,
        product_texts (
          language,
          name,
          description,
          effects,
          side_effects,
          good_for
        ),
        product_tags (
          tag:tags (
            name
          )
        )
      `)
      .order('updated_at', { ascending: false })

    if (productsError) {
      throw new Error(`Failed to fetch products: ${productsError.message}`)
    }

    console.log(`Fetched ${products?.length || 0} products`)

    // Transform to bundle format
    const bundleProducts = (products || []).map((product: any) => ({
      id: product.id,
      category: product.category,
      pointValue: product.point_value,
      texts: product.product_texts.map((text: any) => ({
        language: text.language,
        name: text.name,
        description: text.description,
        effects: text.effects,
        sideEffects: text.side_effects,
        goodFor: text.good_for,
      })),
      tags: product.product_tags.map((pt: any) => pt.tag.name),
      createdAt: product.created_at,
      updatedAt: product.updated_at,
    }))

    // Create bundle
    const bundle = {
      schemaVersion: '2024.10.26',
      builtAt: new Date().toISOString(),
      productCount: bundleProducts.length,
      products: bundleProducts,
      purchaseLog: [],
    }

    const bundleJson = JSON.stringify(bundle)
    const bundleBytes = new TextEncoder().encode(bundleJson)

    console.log(`Bundle size: ${bundleBytes.length} bytes`)

    // Compress with gzip
    const compressed = gzip(bundleBytes)

    console.log(`Compressed size: ${compressed.length} bytes`)

    // Calculate ETag
    const hashBuffer = await crypto.subtle.digest('SHA-256', compressed)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const etag = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    console.log(`ETag: ${etag}`)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseClient
      .storage
      .from('bundles')
      .upload('bundle.json.gz', compressed, {
        contentType: 'application/gzip',
        upsert: true,
        cacheControl: '300', // 5 minutes
      })

    if (uploadError) {
      throw new Error(`Failed to upload bundle: ${uploadError.message}`)
    }

    console.log('Bundle uploaded to storage')

    // Save metadata
    const { error: metaError } = await supabaseClient
      .from('bundle_metadata')
      .insert({
        etag,
        product_count: bundleProducts.length,
        size_bytes: compressed.length,
      })

    if (metaError) {
      console.error('Failed to save metadata:', metaError)
    }

    // Get public URL
    const { data: urlData } = supabaseClient
      .storage
      .from('bundles')
      .getPublicUrl('bundle.json.gz')

    return new Response(
      JSON.stringify({
        success: true,
        etag,
        productCount: bundleProducts.length,
        sizeBytes: compressed.length,
        url: urlData.publicUrl,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  } catch (error) {
    console.error('Error generating bundle:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  }
})
```

#### 2.3 Deploy Edge Function
```bash
supabase functions deploy generate-bundle
```

### Phase 3: Database Trigger for Auto-Generation

```sql
-- Create trigger function to regenerate bundle on data changes
CREATE OR REPLACE FUNCTION trigger_bundle_generation()
RETURNS TRIGGER AS $$
BEGIN
  -- Call Edge Function via pg_net (Supabase extension)
  PERFORM
    net.http_post(
      url := 'https://your-project.supabase.co/functions/v1/generate-bundle',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      )
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on products table
CREATE TRIGGER products_changed
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_bundle_generation();

-- Trigger on product_texts table
CREATE TRIGGER product_texts_changed
  AFTER INSERT OR UPDATE OR DELETE ON product_texts
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_bundle_generation();

-- Trigger on product_tags table
CREATE TRIGGER product_tags_changed
  AFTER INSERT OR UPDATE OR DELETE ON product_tags
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_bundle_generation();
```

### Phase 4: Update MCP Server

#### 4.1 Install Supabase Client
```bash
cd mcp-server
npm install @supabase/supabase-js
```

#### 4.2 Update MCP Server (`mcp-server/index-supabase.js`)
```javascript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const server = new Server({
  name: 'pdg-mcp-server-supabase',
  version: '2.0.0',
}, {
  capabilities: { tools: {} },
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'pdg.product.add',
        description: 'Add a new product to Supabase',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            category: { type: 'string', enum: ['health', 'cosmetic'] },
            pointValue: { type: 'number' },
            texts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  language: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  effects: { type: 'string' },
                  sideEffects: { type: 'string' },
                  goodFor: { type: 'string' },
                },
              },
            },
            tags: { type: 'array', items: { type: 'string' } },
          },
          required: ['id', 'category', 'pointValue', 'texts'],
        },
      },
      {
        name: 'pdg.bundle.status',
        description: 'Get current bundle status',
        inputSchema: { type: 'object', properties: {} },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'pdg.product.add': {
        // Insert product
        const { data: product, error: productError } = await supabase
          .from('products')
          .insert({
            id: args.id,
            category: args.category,
            point_value: args.pointValue,
          })
          .select()
          .single();

        if (productError) throw productError;

        // Insert texts
        const textsData = args.texts.map(text => ({
          product_id: args.id,
          language: text.language,
          name: text.name,
          description: text.description,
          effects: text.effects,
          side_effects: text.sideEffects,
          good_for: text.goodFor,
        }));

        const { error: textsError } = await supabase
          .from('product_texts')
          .insert(textsData);

        if (textsError) throw textsError;

        // Insert tags
        if (args.tags?.length) {
          for (const tagName of args.tags) {
            // Insert tag if not exists
            const { data: tag } = await supabase
              .from('tags')
              .upsert({ name: tagName }, { onConflict: 'name' })
              .select()
              .single();

            if (tag) {
              await supabase
                .from('product_tags')
                .insert({
                  product_id: args.id,
                  tag_id: tag.id,
                });
            }
          }
        }

        // Database trigger will automatically regenerate bundle!

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              product: product,
              message: 'Product added! Bundle will regenerate automatically.',
            }, null, 2),
          }],
        };
      }

      case 'pdg.bundle.status': {
        const { data: metadata } = await supabase
          .from('bundle_metadata')
          .select('*')
          .order('built_at', { ascending: false })
          .limit(1)
          .single();

        const { data: urlData } = supabase
          .storage
          .from('bundles')
          .getPublicUrl('bundle.json.gz');

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              last_build: metadata?.built_at,
              etag: metadata?.etag,
              product_count: metadata?.product_count,
              size_bytes: metadata?.size_bytes,
              url: urlData.publicUrl,
            }, null, 2),
          }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          error: error.message,
          success: false,
        }, null, 2),
      }],
      isError: true,
    };
  }
});

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
console.error('PDG MCP Server (Supabase) running');
```

### Phase 5: Update MyApp

#### 5.1 Update Sync Function (`myapp/lib/sync.ts`)
```typescript
const BUNDLE_URL = process.env.NEXT_PUBLIC_SUPABASE_BUNDLE_URL ||
  'https://your-project.supabase.co/storage/v1/object/public/bundles/bundle.json.gz';

export async function syncNow(): Promise<SyncResult> {
  try {
    console.log('Fetching bundle from Supabase Storage...');

    const response = await fetch(BUNDLE_URL, {
      cache: 'no-store', // Always get fresh bundle
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    // Rest of sync logic remains the same...
    const compressed = await response.arrayBuffer();
    const decompressed = pako.ungzip(new Uint8Array(compressed), { to: 'string' });
    const data = JSON.parse(decompressed);

    // Transform and save to IndexedDB
    // ... existing code ...

    return { success: true, productCount: data.productCount };
  } catch (error) {
    console.error('Sync error:', error);
    return { success: false, error: String(error) };
  }
}
```

#### 5.2 Environment Variables
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SUPABASE_BUNDLE_URL=https://your-project.supabase.co/storage/v1/object/public/bundles/bundle.json.gz
```

### Phase 6: Remove Git Workflow

#### 6.1 Delete Obsolete Files
```bash
# Remove git-based automation
rm sync-bundle.sh
rm .github/workflows/sync-bundle.yml
rm MCP_WORKFLOW.md
rm AUTOMATIC_SYNC.md

# Keep database-related files for migration
# - prisma/dev.db (for one-time migration)
# - mcp-server/build-bundle-direct.js (for migration)
```

#### 6.2 Update `.gitignore`
```gitignore
# Supabase
.env.local
supabase/.branches
supabase/.temp

# No longer need to ignore these
# dist/bundle.json.gz (not used)
# myapp/public/bundle.json.gz (not used)
```

---

## 🔄 Migration Guide

### Step 1: Export Existing Data
```bash
# Export from SQLite to JSON
node mcp-server/build-bundle-direct.js
gunzip -c dist/bundle.json.gz > migration-data.json
```

### Step 2: Import to Supabase
```bash
# Create import script
node migrate-to-supabase.js
```

**`migrate-to-supabase.js`:**
```javascript
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const data = JSON.parse(fs.readFileSync('migration-data.json', 'utf-8'));

for (const product of data.products) {
  // Insert product
  await supabase.from('products').insert({
    id: product.id,
    category: product.category,
    point_value: product.pointValue,
    created_at: product.createdAt,
    updated_at: product.updatedAt,
  });

  // Insert texts
  for (const text of product.texts) {
    await supabase.from('product_texts').insert({
      product_id: product.id,
      language: text.language,
      name: text.name,
      description: text.description,
      effects: text.effects,
      side_effects: text.sideEffects,
      good_for: text.goodFor,
    });
  }

  // Insert tags
  for (const tagName of product.tags) {
    const { data: tag } = await supabase
      .from('tags')
      .upsert({ name: tagName }, { onConflict: 'name' })
      .select()
      .single();

    await supabase.from('product_tags').insert({
      product_id: product.id,
      tag_id: tag.id,
    });
  }
}

console.log(`✅ Migrated ${data.products.length} products`);
```

### Step 3: Test Supabase Setup
```bash
# Manually trigger bundle generation
curl -X POST https://your-project.supabase.co/functions/v1/generate-bundle \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"

# Check bundle URL
curl https://your-project.supabase.co/storage/v1/object/public/bundles/bundle.json.gz \
  -o test-bundle.gz
gunzip -c test-bundle.gz | jq '.productCount'
```

### Step 4: Update Claude Desktop Config
```json
{
  "mcpServers": {
    "pdg-supabase": {
      "command": "node",
      "args": ["/path/to/mcp-server/index-supabase.js"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"
      }
    }
  }
}
```

### Step 5: Update MyApp
```bash
# Add environment variables to Vercel
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add NEXT_PUBLIC_SUPABASE_BUNDLE_URL

# Deploy
cd myapp
vercel --prod
```

### Step 6: Test End-to-End
```bash
# 1. Add product via MCP in Claude Desktop
# 2. Wait ~1 second for automatic bundle generation
# 3. Open MyApp and click "Sync Now"
# 4. New product should appear immediately!
```

---

## 💰 Cost Analysis

### Supabase Free Tier
- Database: 500 MB (plenty for products)
- Storage: 1 GB (enough for bundles)
- Bandwidth: 5 GB/month
- Edge Functions: 500K invocations/month
- **Cost: $0/month**

### Estimated Usage
- Products: ~10 KB per 100 products = 100 KB total
- Bundle: ~2 KB gzipped
- Bandwidth: ~2 KB × 1000 syncs = 2 MB/month
- Edge Functions: ~10 invocations/day = 300/month

**Total: Well within free tier! 🎉**

### When to Upgrade ($25/month Pro)
- > 10,000 products
- > 100 GB bandwidth
- > 2 million Edge Function invocations
- Need advanced features (backups, custom domains)

---

## 📊 Workflow Comparison

### Current (Git-Based)
```
Add product → ./sync-bundle.sh → git commit → git push →
GitHub Actions → Vercel deploy → MyApp sync
Time: 2-5 minutes
Steps: 6 manual/automated
```

### Supabase (Automated)
```
Add product → Database trigger → Edge Function → MyApp sync
Time: < 1 second
Steps: 0 manual
```

**Improvement: 120-300x faster, 100% automated!**

---

## ✅ Recommendations

### Use Supabase If:
- ✅ You want fully automatic workflow
- ✅ Multiple people will add products
- ✅ You need real-time updates
- ✅ You want to avoid git pollution
- ✅ You're comfortable with cloud services

### Keep Git-Based If:
- ✅ You want complete local control
- ✅ Data history in git is important
- ✅ Offline-first development required
- ✅ You prefer self-hosted solutions
- ✅ Privacy/compliance requires on-premise

### Hybrid Approach:
- Use Supabase for production
- Keep SQLite for local development
- Sync between them as needed

---

## 🚀 Next Steps

1. **Create Supabase project** (5 min)
2. **Run database migrations** (2 min)
3. **Deploy Edge Function** (3 min)
4. **Migrate existing data** (5 min)
5. **Update MCP server** (10 min)
6. **Update MyApp** (5 min)
7. **Test end-to-end** (5 min)

**Total setup time: ~35 minutes**

**Result: Fully automated, real-time bundle system! 🎉**

---

Want me to implement this? I can:
1. Create all Supabase migration files
2. Update MCP server code
3. Update MyApp sync logic
4. Create migration scripts
5. Update documentation

Let me know if you want to proceed!
