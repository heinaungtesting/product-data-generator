# Clean Rebuild Plan - Staff Point Management System

This document outlines the step-by-step process to rebuild the project cleanly with Supabase.

---

## 🎯 Goals

Build a simple, production-ready system with:
- ✅ Product catalog (multi-language: JA, EN, ZH, TH, KO)
- ✅ Staff point management
- ✅ Owner portal (manage products, log sales)
- ✅ Staff portal (view points, history, calendar)
- ✅ MCP integration (Claude for translations)
- ❌ No offline features (removed)

---

## 📊 New Architecture

```
┌─────────────────────────────────────────────┐
│     Supabase PostgreSQL (Single Source)     │
│  - products, product_texts, tags            │
│  - staff, point_logs                        │
│  - Real-time subscriptions                  │
└──────────────┬──────────────────────────────┘
               │
        ┌──────┴─────────┬─────────────┐
        │                │             │
   ┌────▼─────┐    ┌────▼────┐   ┌───▼────────┐
   │  Owner   │    │  Staff  │   │    MCP     │
   │  Portal  │    │ Portal  │   │  (Claude)  │
   │          │    │         │   │            │
   │ - Browse │    │ - Points│   │ - Add prod │
   │   prods  │    │ - History│  │ - Translate│
   │ - Log    │    │ - Calendar│ │            │
   │   sales  │    │         │   └────────────┘
   │ - Manage │    │         │
   │   staff  │    │         │
   └──────────┘    └─────────┘
```

---

## 🗂️ Clean File Structure

```
product-data-generator/
├── app/                           # Next.js App Router
│   ├── (owner)/                  # Owner portal (protected)
│   │   ├── layout.tsx           # Owner layout with nav
│   │   ├── page.tsx             # Product catalog + quick log
│   │   ├── staff/               # Staff management
│   │   │   └── page.tsx
│   │   └── analytics/           # Reports (optional)
│   │       └── page.tsx
│   ├── (staff)/                  # Staff portal
│   │   ├── layout.tsx           # Staff layout
│   │   ├── page.tsx             # Points dashboard
│   │   ├── history/             # Transaction history
│   │   │   └── page.tsx
│   │   └── calendar/            # Calendar view
│   │       └── page.tsx
│   ├── api/                      # API Routes
│   │   ├── products/
│   │   │   ├── route.ts        # List/Create products
│   │   │   └── [id]/route.ts   # Get/Update/Delete product
│   │   ├── staff/
│   │   │   ├── route.ts        # List/Create staff
│   │   │   └── [id]/
│   │   │       ├── route.ts    # Get/Update staff
│   │   │       └── points/route.ts  # Point operations
│   │   └── auth/
│   │       ├── login/route.ts
│   │       └── logout/route.ts
│   ├── login/page.tsx            # Login page
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles
├── components/                    # Reusable UI components
│   ├── ProductCard.tsx
│   ├── ProductForm.tsx
│   ├── StaffSelector.tsx
│   ├── PointLogDialog.tsx
│   ├── PointsCalendar.tsx
│   └── StatsCard.tsx
├── lib/                          # Utilities
│   ├── supabase.ts              # ✅ Keep (already created)
│   ├── auth.ts                  # Simple auth helpers
│   └── utils.ts                 # Helpers
├── types/                        # TypeScript types
│   └── supabase.ts              # ✅ Keep (already created)
├── supabase/                     # Supabase config
│   └── migrations/              # ✅ Keep (already created)
└── mcp-server/                   # Claude integration
    └── index.ts                 # Update for Supabase

Total: ~30-35 files (vs 78 current)
```

---

## 📅 Rebuild Timeline (3-4 Days)

### **Day 1: Foundation + Products**
- ✅ Set up Supabase project
- ✅ Apply migrations
- ✅ Clean up codebase (remove offline)
- ✅ Build Product API (Supabase)
- ✅ Build Product Catalog UI
- ✅ Test with existing data

### **Day 2: Staff System**
- ✅ Build Staff API
- ✅ Build Staff Management UI
- ✅ Build Point Logging UI
- ✅ Test point calculations

### **Day 3: Staff Portal**
- ✅ Build Staff Login
- ✅ Build Points Dashboard
- ✅ Build History View
- ✅ Build Calendar View

### **Day 4: Polish & Deploy**
- ✅ Update MCP server
- ✅ Add analytics/reports
- ✅ Test everything
- ✅ Deploy to Vercel

---

## 🚀 Implementation Steps

### **STEP 1: Set Up Supabase** (15 minutes)

Follow `SUPABASE_SETUP_GUIDE.md`:

1. Create Supabase account
2. Create project
3. Get API keys
4. Configure `.env.local`:
   ```bash
   cp .env.local.example .env.local
   # Fill in Supabase credentials
   ```
5. Apply migrations:
   ```bash
   npx supabase db push
   ```
6. Test connection:
   ```bash
   npx tsx scripts/test-supabase-connection.ts
   ```

✅ **Checkpoint:** All tests pass

---

### **STEP 2: Clean Up Codebase** (30 minutes)

Remove unnecessary features:

```bash
# Remove offline features
rm -rf myapp/lib/db.ts
rm -rf myapp/lib/sync.ts
rm -rf myapp/public/sw.js
rm -rf myapp/app/offline/

# Remove bundle system
rm -rf .github/workflows/publish-bundle.yml

# Remove Prisma (after migrating data)
# We'll do this last for safety
```

---

### **STEP 3: Migrate Existing Data** (10 minutes)

```bash
npm run db:migrate-to-supabase
```

Verify in Supabase dashboard.

---

### **STEP 4: Build Product API** (2 hours)

I'll create:
- `lib/product-service.ts` - Supabase queries
- `app/api/products/route.ts` - List/Create
- `app/api/products/[id]/route.ts` - Get/Update/Delete

✅ **Checkpoint:** Can CRUD products via API

---

### **STEP 5: Build Product Catalog UI** (3 hours)

I'll create:
- `app/(owner)/page.tsx` - Product list with search
- `components/ProductCard.tsx`
- `components/ProductForm.tsx`

✅ **Checkpoint:** Can manage products in UI

---

### **STEP 6: Build Staff System** (4 hours)

I'll create:
- `lib/staff-service.ts` - Staff & point queries
- `app/api/staff/` - Staff API
- `app/api/staff/[id]/points/route.ts` - Point logging
- `app/(owner)/staff/page.tsx` - Staff management
- `components/StaffSelector.tsx`
- `components/PointLogDialog.tsx`

✅ **Checkpoint:** Can log sales and assign points

---

### **STEP 7: Build Staff Portal** (4 hours)

I'll create:
- `app/(staff)/page.tsx` - Points dashboard
- `app/(staff)/history/page.tsx` - Transaction list
- `app/(staff)/calendar/page.tsx` - Calendar view
- `components/PointsCalendar.tsx`

✅ **Checkpoint:** Staff can view their points

---

### **STEP 8: Update MCP Server** (1 hour)

Update `mcp-server/index.ts` to use Supabase.

✅ **Checkpoint:** Claude can manage products

---

### **STEP 9: Deploy** (1 hour)

```bash
# Deploy to Vercel
vercel --prod

# Set environment variables in Vercel dashboard
```

✅ **Checkpoint:** Live and working!

---

## 🎯 What YOU Need to Do

### **Before I Start Building:**

1. **Create Supabase project** (15 min)
   - Go to supabase.com
   - Create account
   - Create new project
   - Get API keys

2. **Configure environment** (5 min)
   ```bash
   cp .env.local.example .env.local
   # Fill in your Supabase credentials
   ```

3. **Install dependencies** (2 min)
   ```bash
   npm install
   ```

4. **Apply migrations** (2 min)
   ```bash
   npx supabase db push
   ```

5. **Test connection** (1 min)
   ```bash
   npx tsx scripts/test-supabase-connection.ts
   ```

**Total: ~25 minutes**

---

## ✅ Success Criteria

By the end, you'll have:

- ✅ Clean codebase (~35 files)
- ✅ Supabase-only (no SQLite)
- ✅ Owner can manage products
- ✅ Owner can log sales → assign points to staff
- ✅ Staff can view points, history, calendar
- ✅ MCP for product translations
- ✅ Multi-language support
- ✅ Production-ready
- ✅ Easy to maintain

---

## 🚨 What We're Removing

- ❌ SQLite/Prisma
- ❌ IndexedDB/Dexie
- ❌ Service Workers
- ❌ Bundle sync system
- ❌ GitHub Actions (bundle generation)
- ❌ MyApp offline PWA
- ❌ Dual database complexity

**Result:** 45% less code, 100% of features you need!

---

## 📞 Next Steps

**Tell me when you're ready:**

1. **"I have Supabase set up"** → I'll start building immediately
2. **"Help me set up Supabase"** → I'll guide you step-by-step
3. **"Show me what you'll build first"** → I'll show the first component

**What's your status?** 🚀
