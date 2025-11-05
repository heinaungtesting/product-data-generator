# Supabase Setup Guide

This guide walks you through setting up the Product Data Generator with Supabase for real-time, automatic bundle generation.

## Overview

The Supabase architecture eliminates the need for manual bundle syncing and git commits. When you add or update products via Claude Desktop (MCP), the bundle is automatically regenerated within seconds.

**Benefits:**
- ⚡ Real-time updates (< 1 second vs 2-5 minutes)
- 🔄 Automatic bundle generation (no manual scripts)
- 📦 No git commits for data changes
- 💰 Free tier: $0/month (up to 500MB database, 1GB storage)
- 🌐 Built-in CDN for bundle delivery

## Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **Node.js**: Version 18+ installed
3. **Supabase CLI**: Install with `npm install -g supabase`

## Step 1: Create Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in:
   - **Name**: `product-data-generator` (or your preferred name)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
4. Click "Create Project" (takes ~2 minutes)

## Step 2: Get Your API Keys

1. Go to **Project Settings** → **API**
2. Copy these values (you'll need them later):
   - **Project URL**: `https://your-project-ref.supabase.co`
   - **anon public key**: For MyApp frontend
   - **service_role key**: For MCP server (keep secret!)

## Step 3: Initialize Supabase Locally

```bash
cd product-data-generator

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Push database schema
supabase db push
```

This will apply the migration in `supabase/migrations/20250105000000_initial_schema.sql`.

## Step 4: Create Storage Bucket

1. Go to **Storage** in Supabase dashboard
2. Click "New Bucket"
3. Enter:
   - **Name**: `bundles`
   - **Public bucket**: ✅ Enable (bundles need to be publicly accessible)
4. Click "Create Bucket"

## Step 5: Deploy Edge Function

```bash
# Deploy the generate-bundle function
supabase functions deploy generate-bundle

# Set environment variables for the function
supabase secrets set SUPABASE_URL=https://your-project-ref.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Step 6: Test Bundle Generation

```bash
# Manually trigger bundle generation
supabase functions invoke generate-bundle

# You should see:
# {
#   "success": true,
#   "etag": "abc123...",
#   "productCount": 0,
#   "url": "https://your-project-ref.supabase.co/storage/v1/object/public/bundles/bundle.json.gz"
# }
```

## Step 7: Configure MCP Server

### Update Environment Variables

Create `mcp-server/.env`:

```bash
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Update Claude Desktop Config

Edit your Claude Desktop MCP config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Update the product-data-generator entry:

```json
{
  "mcpServers": {
    "product-data-generator": {
      "command": "node",
      "args": [
        "/absolute/path/to/product-data-generator/mcp-server/index-supabase.js"
      ],
      "env": {
        "SUPABASE_URL": "https://your-project-ref.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"
      }
    }
  }
}
```

### Install Supabase Dependency

```bash
cd mcp-server
npm install @supabase/supabase-js
```

### Restart Claude Desktop

Quit and reopen Claude Desktop to load the new MCP server.

## Step 8: Configure MyApp

Update `myapp/.env.local`:

```bash
NEXT_PUBLIC_BUNDLE_URL=https://your-project-ref.supabase.co/storage/v1/object/public/bundles/bundle.json.gz
```

Restart your MyApp development server:

```bash
cd myapp
npm run dev
```

## Step 9: Migrate Existing Data (Optional)

If you have existing products in SQLite/Prisma, migrate them:

```bash
# Set environment variables
export SUPABASE_URL=https://your-project-ref.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Run migration script
node scripts/migrate-to-supabase.js
```

The script will:
1. Read all products from `prisma/dev.db`
2. Upload them to Supabase
3. Trigger bundle generation
4. Verify the migration

## Step 10: Test End-to-End

### Add a Product via Claude Desktop

Open Claude Desktop and ask:

> "Add a new product with ID 'test-001', category 'health', name 'Test Product'"

You should see:
```json
{
  "success": true,
  "message": "Product created successfully. Bundle regeneration triggered automatically.",
  "product": {
    "id": "test-001",
    "category": "health",
    "name": "Test Product"
  }
}
```

### Verify Bundle Generation

Check Supabase dashboard:
1. Go to **Storage** → **bundles**
2. You should see `bundle.json.gz` with a recent timestamp

### Sync MyApp

1. Open MyApp in browser
2. Go to **Settings**
3. Click the sync button or wait for auto-sync
4. You should see "test-001" in the product list

## Troubleshooting

### Bundle Not Generating

**Check Edge Function Logs:**
```bash
supabase functions logs generate-bundle
```

**Common Issues:**
- Environment variables not set in Edge Function
- Storage bucket not public
- Database triggers not created

### MCP Server Not Working

**Check Claude Desktop Logs:**
- macOS: `~/Library/Logs/Claude/mcp*.log`
- Windows: `%APPDATA%\Claude\logs\mcp*.log`

**Common Issues:**
- Wrong path to `index-supabase.js`
- Missing `@supabase/supabase-js` dependency
- Invalid Supabase credentials

### MyApp Not Syncing

**Check Browser Console:**
- Network tab for bundle fetch errors
- Console for decompression errors

**Common Issues:**
- Wrong `NEXT_PUBLIC_BUNDLE_URL`
- Bundle bucket not public
- CORS issues (should be automatically configured)

## Database Triggers Explained

The system uses PostgreSQL triggers to automatically regenerate bundles:

```sql
-- Triggers on these tables invoke generate-bundle Edge Function:
- products (INSERT, UPDATE, DELETE)
- product_texts (INSERT, UPDATE, DELETE)
- product_tags (INSERT, UPDATE, DELETE)
```

When you add/update/delete a product via MCP, the trigger fires and:
1. Calls the Edge Function
2. Edge Function queries all products
3. Generates compressed bundle
4. Uploads to Storage
5. Updates bundle_metadata table

This happens in < 1 second, so MyApp users see updates almost instantly.

## Cost Estimate

**Supabase Free Tier:**
- 500 MB database storage
- 1 GB file storage
- 2 GB bandwidth
- 500K Edge Function invocations

**Typical Usage:**
- Database: ~10 MB (1000s of products)
- Storage: ~1 MB (bundle)
- Bandwidth: ~100 MB/month (100 syncs)
- Edge Functions: ~100/month

**Result: $0/month** for typical usage 🎉

## Next Steps

1. ✅ Add real products via Claude Desktop
2. ✅ Test bundle auto-generation
3. ✅ Verify MyApp syncs correctly
4. 🚀 Deploy MyApp to Vercel/Netlify
5. 📱 Install MyApp as PWA on mobile

## Support

- **Supabase Docs**: https://supabase.com/docs
- **Edge Functions**: https://supabase.com/docs/guides/functions
- **Storage**: https://supabase.com/docs/guides/storage
- **MCP SDK**: https://github.com/anthropics/mcp

## Architecture Diagram

```
┌─────────────────┐
│  Claude Desktop │
│    (MCP Client) │
└────────┬────────┘
         │ Add/Update Product
         ▼
┌─────────────────┐
│   MCP Server    │
│  (index-supabase│
│      .js)       │
└────────┬────────┘
         │ Insert via Supabase API
         ▼
┌─────────────────┐      ┌──────────────────┐
│ Supabase        │      │  Database        │
│ PostgreSQL      │◄────►│  Trigger         │
└────────┬────────┘      └────────┬─────────┘
         │                        │
         │ Auto-invoke            │
         ▼                        ▼
┌─────────────────┐      ┌──────────────────┐
│  Edge Function  │      │  Generate Bundle │
│  (Deno)         │─────►│  Upload Storage  │
└─────────────────┘      └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │ Supabase Storage │
                         │ (Public CDN)     │
                         └────────┬─────────┘
                                  │ Fetch bundle.json.gz
                                  ▼
                         ┌──────────────────┐
                         │     MyApp PWA    │
                         │  (Next.js + IDB) │
                         └──────────────────┘
```

---

**You're all set!** 🎉

The Product Data Generator now runs on a modern, real-time architecture with automatic bundle generation and zero manual steps.
