# Supabase Setup Guide

Complete guide to set up Supabase for your Product Data Generator with Staff Point Management System.

---

## 📋 Prerequisites

- Node.js 18+ installed
- Existing SQLite database with products (optional, for migration)
- 15 minutes of time

---

## Step 1: Create Supabase Account & Project

### 1.1 Sign Up for Supabase

1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Sign up with GitHub (recommended) or email
4. Verify your email if needed

### 1.2 Create New Project

1. Click **"New Project"**
2. Select your organization (or create one)
3. Fill in project details:
   - **Name**: `product-data-generator` (or your choice)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your location
     - `us-east-1` (US East)
     - `ap-southeast-1` (Singapore)
     - `eu-west-1` (Ireland)
     - etc.
   - **Pricing Plan**: Free (includes 500MB database, 1GB storage)

4. Click **"Create new project"**
5. Wait ~2 minutes for provisioning

---

## Step 2: Get API Keys

### 2.1 Navigate to API Settings

1. In your Supabase project dashboard
2. Go to **Settings** (⚙️ icon in left sidebar)
3. Click **API**

### 2.2 Copy These Values

You'll need 3 values:

1. **Project URL**
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```

2. **anon public key** (under "Project API keys")
   ```
   eyJhbGc...very-long-key...
   ```

3. **service_role key** (click "Reveal" first)
   ```
   eyJhbGc...another-long-key...
   ```

⚠️ **Keep service_role key SECRET!** Never commit to Git or share publicly.

---

## Step 3: Configure Local Environment

### 3.1 Create `.env.local` File

```bash
# Copy the example file
cp .env.local.example .env.local
```

### 3.2 Edit `.env.local`

Open `.env.local` and fill in your Supabase credentials:

```bash
# ============================================================================
# SUPABASE DATABASE (Primary - Required for production)
# ============================================================================
NEXT_PUBLIC_SUPABASE_URL="https://xxxxxxxxxxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGc...your-anon-key..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGc...your-service-role-key..."

# Keep other settings as-is for now...
```

⚠️ Make sure `.env.local` is in `.gitignore` (it already is)

---

## Step 4: Install Dependencies

```bash
npm install
```

This will install:
- `@supabase/supabase-js` - Supabase client
- `dotenv` - Environment variable loader

---

## Step 5: Run Database Migrations

### 5.1 Option A: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI globally (if not installed)
npm install -g supabase

# Login to Supabase
npx supabase login

# Link to your project
npx supabase link --project-ref xxxxxxxxxxxxx

# Push migrations to Supabase
npx supabase db push
```

### 5.2 Option B: Manual SQL Execution

1. Go to Supabase Dashboard
2. Click **SQL Editor** in left sidebar
3. Click **"New query"**
4. Copy contents of `supabase/migrations/20250115000000_add_staff_point_system.sql`
5. Paste into SQL editor
6. Click **"Run"** (or press Ctrl/Cmd + Enter)
7. Verify: Should see "Success. No rows returned"

---

## Step 6: Test Connection

Run the test script:

```bash
npx tsx scripts/test-supabase-connection.ts
```

**Expected output:**

```
🧪 Testing Supabase Connection...

📋 Test 1: Environment Variables
  ✅ NEXT_PUBLIC_SUPABASE_URL: https://xxxxxxxxxxxxx.supabase.co...
  ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: eyJhbGc...
  ✅ SUPABASE_SERVICE_ROLE_KEY: eyJhbGc...
  ✅ All environment variables are set

🔌 Test 2: Connection
  ✅ Successfully connected to Supabase

📊 Test 3: Required Tables
  ✅ Table "products" exists
  ✅ Table "product_texts" exists
  ✅ Table "tags" exists
  ✅ Table "product_tags" exists
  ✅ Table "staff" exists
  ✅ Table "point_logs" exists
  ✅ All required tables exist

🔍 Test 4: Query Data
  ✅ Products in database: 0
  ✅ Staff in database: 0
  ✅ Point logs in database: 0

🔐 Test 5: Permissions
  ✅ Can insert data
  ✅ Can update data
  ✅ Can delete data

============================================================
✅ ALL TESTS PASSED!
============================================================

🎉 Your Supabase database is ready to use!
```

If you see errors, check:
- Environment variables are correct
- Migrations ran successfully
- Project is not paused (free tier pauses after 7 days of inactivity)

---

## Step 7: Migrate Existing Data (Optional)

If you have existing products in SQLite:

### 7.1 Backup SQLite Database

```bash
# Create backup directory
mkdir -p backup

# Copy database
cp prisma/dev.db backup/dev-$(date +%Y%m%d).db
```

### 7.2 Run Migration Script

```bash
npm run db:migrate-to-supabase
```

**Expected output:**

```
🚀 Starting SQLite to Supabase migration...

✅ Backup created: backup/sqlite-backup-2025-01-15.db

🔍 Checking Supabase tables...
✅ All required tables exist

📦 Migrating tags...
✅ Migrated 15 tags

📦 Migrating products...
Found 47 products to migrate
  Migrated 10 products...
  Migrated 20 products...
  Migrated 30 products...
  Migrated 40 products...
✅ Migrated 47 products

🔍 Verifying migration...
SQLite products: 47
Supabase products: 47
✅ Product counts match!

============================================================
📊 MIGRATION SUMMARY
============================================================
Products migrated:       47
Product texts migrated:  235 (47 × 5 languages)
Tags migrated:           15
Product-tags migrated:   94
Errors:                  0
============================================================

✅ Migration completed successfully!

📝 Next steps:
  1. Verify data in Supabase dashboard
  2. Test API routes with Supabase
  3. Keep SQLite backup for safety
  4. Once verified, you can remove Prisma dependencies
```

### 7.3 Verify in Supabase Dashboard

1. Go to Supabase Dashboard
2. Click **Table Editor** in left sidebar
3. Select **products** table
4. Verify your products are there
5. Check **product_texts** for translations
6. Check **tags** for your tags

---

## Step 8: Verify Everything Works

### 8.1 Test API Routes

```bash
# Start development server
npm run dev
```

Open http://localhost:3000 and verify:
- Products load correctly
- Can create new products
- Can edit products
- Multi-language data displays

### 8.2 View Data in Supabase

1. Go to **Table Editor**
2. Browse tables:
   - `products` - Your product catalog
   - `product_texts` - Multi-language data
   - `tags` - Product tags
   - `staff` - Staff members (empty for now)
   - `point_logs` - Point transactions (empty for now)

---

## Step 9: (Optional) Generate TypeScript Types

Auto-generate types from your Supabase schema:

```bash
npm run supabase:types
```

This updates `types/supabase.ts` with the latest schema.

---

## 🎉 You're Done!

Your Supabase database is now set up and ready for:
- ✅ Product management
- ✅ Multi-language support
- ✅ Staff point tracking (Phase 4+)
- ✅ Real-time updates (Phase 2+)

---

## 🚨 Troubleshooting

### Problem: "Cannot find module '@supabase/supabase-js'"

**Solution:**
```bash
npm install
```

### Problem: "Missing NEXT_PUBLIC_SUPABASE_URL"

**Solution:**
- Check `.env.local` exists
- Verify environment variables are set correctly
- Restart dev server after changing `.env.local`

### Problem: "Table does not exist"

**Solution:**
```bash
# Run migrations again
npx supabase db push

# Or manually run SQL in Supabase dashboard
```

### Problem: "RLS policy violation"

**Solution:**
- Check Row Level Security policies in Supabase dashboard
- For now, you can disable RLS on tables:
  ```sql
  ALTER TABLE products DISABLE ROW LEVEL SECURITY;
  ALTER TABLE staff DISABLE ROW LEVEL SECURITY;
  ALTER TABLE point_logs DISABLE ROW LEVEL SECURITY;
  ```

### Problem: "Connection refused"

**Solution:**
- Check Supabase project is not paused (Settings → General)
- Verify SUPABASE_URL is correct
- Check internet connection

### Problem: Migration script fails

**Solution:**
```bash
# Check SQLite database exists
ls -la prisma/dev.db

# Check Supabase tables exist
npx tsx scripts/test-supabase-connection.ts

# Review error messages and fix manually
```

---

## 📚 Next Steps

After successful setup:

1. **Phase 2**: Convert API routes to use Supabase
2. **Phase 3**: Remove offline features from MyApp
3. **Phase 4**: Build owner portal point logging
4. **Phase 5**: Build staff portal
5. **Phase 6**: Update MCP server for Supabase

---

## 🔗 Useful Links

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli/introduction)

---

## 💡 Tips

- **Free tier limits**: 500MB database, 1GB file storage, 2GB bandwidth
- **Project pausing**: Free projects pause after 7 days of inactivity (1 click to resume)
- **Backups**: Free tier includes automatic daily backups (7-day retention)
- **Monitoring**: Use Supabase dashboard to monitor usage
- **Upgrading**: Can upgrade to Pro ($25/month) if you need more resources

---

**Need help?** Check the troubleshooting section above or open an issue on GitHub.
