# Project Summary - Staff Point Management System

**Date:** 2025-01-15
**Session:** Architecture Review & Implementation Planning
**Status:** Phase 1 Complete, Ready for Implementation

---

## 🎯 FINAL DECISION: Dual-Project Architecture

After extensive discussion, we decided on:

**Keep OLD project (product-data-generator) + Build NEW project (staff-portal)**

### Why This Architecture?

1. ✅ User wants to keep familiar interface for themselves
2. ✅ Staff need simple, mobile-friendly app
3. ✅ Both share same Supabase database
4. ✅ Clean separation of concerns
5. ✅ Minimal changes to existing codebase

---

## 🏗️ Architecture Overview

```
┌────────────────────────────────────────────┐
│     Supabase PostgreSQL (SHARED)           │
│                                             │
│  Tables:                                    │
│  - products (existing products)            │
│  - product_texts (5 languages: JA,EN,ZH,TH,KO) │
│  - tags, product_tags                      │
│  - staff (NEW - 10-50 staff members)       │
│  - point_logs (NEW - transaction history)  │
└──────────────┬──────────────────────────────┘
               │
        ┌──────┴─────────┐
        │                │
   ┌────▼──────────┐  ┌──▼────────────────┐
   │ OLD PROJECT   │  │  NEW PROJECT      │
   │ (Owner)       │  │  (Staff Portal)   │
   ├───────────────┤  ├───────────────────┤
   │ Keep as-is!   │  │ Build fresh!      │
   │               │  │                   │
   │ Add:          │  │ Pages:            │
   │ - Staff mgmt  │  │ - Login           │
   │ - Log sales   │  │ - Dashboard       │
   │ - Point log   │  │ - History         │
   │               │  │ - Calendar        │
   │ Port: 3000    │  │ Port: 3001        │
   └───────────────┘  └───────────────────┘
```

---

## 📊 User Requirements (What User Needs)

### 1. Owner Use Case (User themselves)
- Manage products (100-200 products)
- Multi-language support (JA, EN, ZH, TH, KO)
- Log sales to staff members
- Assign points per product sale
- View staff point balances
- Manage staff (add/edit/view)

### 2. Staff Use Case (10-50 staff members)
- View their own point balance
- See transaction history (which products, when, points earned)
- Calendar view of sales by date
- Mobile-friendly interface
- Simple login (email-based)

### 3. Product Display (NOT IMPLEMENTED YET)
- Show products to customers in Chinese, Korean, English
- Multi-language product catalog
- **Note:** User will publish point system to staff later, product display is secondary

### 4. MCP Integration
- Claude Desktop integration for product management
- AI-powered translation to all 5 languages
- Must continue working with Supabase

### 5. Critical: NO OFFLINE NEEDED
- User explicitly stated "I will not use offline"
- Can remove all offline features (Service Worker, IndexedDB, bundle sync)

---

## ✅ What Was Completed (Phase 1)

### Files Created:

1. **`supabase/migrations/20250115000000_add_staff_point_system.sql`** (380 lines)
   - Complete database schema
   - `staff` table (id, email, name, phone, point_balance, is_active)
   - `point_logs` table (staff_id, product_id, points, product_name, category, notes, log_date)
   - Auto-updating triggers (point_balance updates automatically when logs added)
   - Helper functions (recalculate_staff_balance, get_staff_points_by_date)
   - Row Level Security policies
   - Indexes for performance

2. **`lib/supabase.ts`** (80 lines)
   - Supabase client for browser (anon key)
   - Admin client for API routes (service role key)
   - Connection status helpers

3. **`types/supabase.ts`** (120 lines)
   - TypeScript type definitions for all tables
   - Type-safe database queries

4. **`scripts/migrate-to-supabase.ts`** (300 lines)
   - SQLite to Supabase migration tool
   - Auto-backup before migration
   - Progress tracking
   - Verification & error handling

5. **`scripts/test-supabase-connection.ts`** (280 lines)
   - Connection testing
   - Table verification
   - Permission checks
   - Data query tests

6. **`SUPABASE_SETUP_GUIDE.md`**
   - Complete step-by-step Supabase setup instructions
   - Troubleshooting guide

7. **`REBUILD_PLAN.md`**
   - Initial plan to rebuild from scratch (later rejected)

8. **`docs/DUAL_PROJECT_PLAN.md`**
   - Final architecture plan (dual projects)

### Files Modified:

1. **`package.json`**
   - Added `@supabase/supabase-js@^2.39.0`
   - Added `dotenv@^16.4.5`
   - Added scripts: `db:migrate-to-supabase`, `supabase:types`

2. **`.env.local.example`**
   - Added Supabase environment variables
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY

### Git Status:
- Branch: `claude/review-architecture-0138FbmMDqkYbbeT14VGUc4m`
- All changes committed and pushed
- Safe to continue

---

## 🚧 What Needs to Be Done (Implementation)

### PREREQUISITE: User Must Set Up Supabase (15 min)

**User needs to:**
1. Create Supabase account at supabase.com
2. Create new project
3. Get API keys (URL, anon key, service_role key)
4. Copy `.env.local.example` to `.env.local`
5. Fill in Supabase credentials in `.env.local`
6. Run: `npm install`
7. Run: `npx supabase db push` (apply migrations)
8. Run: `npx tsx scripts/test-supabase-connection.ts` (verify)
9. Optionally run: `npm run db:migrate-to-supabase` (migrate existing products)

**Then user says: "Supabase is ready"**

---

### PART 1: Modify Old Project (product-data-generator)

**Goal:** Add minimal features for staff management and point logging

**Files to CREATE:**

1. **`app/api/staff/route.ts`**
   - GET: List all staff
   - POST: Create new staff

2. **`app/api/staff/[id]/route.ts`**
   - GET: Get single staff
   - PATCH: Update staff
   - DELETE: Delete staff (soft delete - set is_active = false)

3. **`app/api/staff/[id]/points/route.ts`**
   - GET: Get staff point logs
   - POST: Log points (create point_log entry)

4. **`app/(owner)/staff/page.tsx`**
   - Staff management UI
   - List all staff with point balances
   - Add new staff form
   - View individual staff details

5. **`components/PointLogDialog.tsx`**
   - Dialog to log a sale
   - Select staff member from dropdown
   - Confirm points assignment
   - Auto-fills product name, points, category

**Files to MODIFY:**

1. **`app/page.tsx`** (existing product catalog)
   - Add "Log Sale" button to each product
   - Opens PointLogDialog on click
   - Shows success message after logging

**Database Queries:**

```typescript
// List staff
const { data: staff } = await supabase
  .from('staff')
  .select('*')
  .eq('is_active', true)
  .order('name');

// Log points
const { data: log } = await supabase
  .from('point_logs')
  .insert({
    staff_id: selectedStaffId,
    product_id: product.id,
    points: product.point_value,
    product_name: product.name.en, // or current language
    category: product.category,
    notes: optionalNotes,
  })
  .select()
  .single();

// Staff balance updates automatically via database trigger!
```

**Estimated time:** 2-3 hours

---

### PART 2: Create New Staff Portal (staff-portal)

**Goal:** Brand new clean project for staff members

**Project Setup:**

```bash
cd ..
npx create-next-app@latest staff-portal
# Choose: TypeScript, Tailwind, App Router, no src directory

cd staff-portal
npm install @supabase/supabase-js date-fns zustand
```

**Copy from old project:**
```bash
cp ../product-data-generator/lib/supabase.ts lib/
cp ../product-data-generator/types/supabase.ts types/
cp ../product-data-generator/.env.local .env.local
```

**Files to CREATE:**

1. **`app/login/page.tsx`**
   - Simple email-based login
   - No password (just email verification)
   - Or simple PIN code
   - Store staffId in localStorage
   - Redirect to dashboard

2. **`app/page.tsx`** (dashboard)
   - Check if logged in (redirect to /login if not)
   - Fetch staff data from Supabase
   - Display point balance (big number)
   - Show recent 5 transactions
   - Link to history & calendar

3. **`app/history/page.tsx`**
   - List all point_logs for current staff
   - Show: date, product_name, category, points
   - Filter by date range
   - Search by product name
   - Export to CSV (optional)

4. **`app/calendar/page.tsx`**
   - Calendar heatmap view
   - Show daily point totals
   - Click date to see details
   - Month/week navigation

5. **`components/PointsCard.tsx`**
   - Display point balance
   - Gradient background
   - Animation on load

6. **`components/HistoryList.tsx`**
   - Transaction list item
   - Date, product, points

7. **`components/Calendar.tsx`**
   - Calendar heatmap
   - Color intensity based on points

8. **`lib/auth.ts`**
   - Simple auth helpers
   - getStaffId() from localStorage
   - logout() clear localStorage

**Database Queries:**

```typescript
// Get staff info
const staffId = localStorage.getItem('staffId');
const { data: staff } = await supabase
  .from('staff')
  .select('*')
  .eq('id', staffId)
  .single();

// Get point logs
const { data: logs } = await supabase
  .from('point_logs')
  .select('*')
  .eq('staff_id', staffId)
  .order('created_at', { ascending: false });

// Get points by date
const { data: dailyPoints } = await supabase
  .rpc('get_staff_points_by_date', {
    staff_uuid: staffId,
    start_date: '2025-01-01',
    end_date: '2025-01-31'
  });
```

**Design:**
- Mobile-first
- Clean, modern UI
- Blue/indigo gradient for points card
- Simple navigation (bottom tabs or top nav)
- Dark mode support (optional)

**Estimated time:** 4-5 hours

---

### PART 3: Update MCP Server

**Goal:** Make MCP server work with Supabase instead of Prisma

**File to MODIFY:**

1. **`mcp-server/index.js`** → Rename to `index-supabase.js`

**Changes:**
- Replace all Prisma imports with Supabase client
- Update product queries to use Supabase syntax
- Keep all MCP tool definitions the same
- Test with Claude Desktop

**Estimated time:** 1 hour

---

### PART 4: Testing & Deployment

**Testing:**
1. Test old project: Can manage products, staff, log points
2. Test new project: Staff can login, view points, see history
3. Test database sync: Points logged in old project appear immediately in new project
4. Test MCP: Claude can still add/translate products

**Deployment:**
```bash
# Old project
cd product-data-generator
vercel --prod
# Set env vars in Vercel dashboard

# New project
cd staff-portal
vercel --prod
# Set env vars in Vercel dashboard
```

**Estimated time:** 1-2 hours

---

## 📁 Current Project Structure

```
product-data-generator/           ← OLD PROJECT (keep!)
├── app/
│   ├── page.tsx                 ← Product catalog (MODIFY: add log button)
│   ├── staff/                   ← NEW: Staff management
│   ├── api/
│   │   ├── products/            ← Existing (keep)
│   │   ├── staff/               ← NEW: Staff CRUD
│   │   └── ...
├── lib/
│   ├── supabase.ts              ← ✅ Already created
│   └── ...
├── types/
│   └── supabase.ts              ← ✅ Already created
├── supabase/
│   └── migrations/
│       └── 20250115000000_add_staff_point_system.sql  ← ✅ Already created
├── scripts/
│   ├── migrate-to-supabase.ts   ← ✅ Already created
│   └── test-supabase-connection.ts  ← ✅ Already created
└── ...existing files...

staff-portal/                     ← NEW PROJECT (to be created)
├── app/
│   ├── page.tsx                 ← Dashboard
│   ├── login/page.tsx           ← Login
│   ├── history/page.tsx         ← History
│   └── calendar/page.tsx        ← Calendar
├── components/
│   ├── PointsCard.tsx
│   ├── HistoryList.tsx
│   └── Calendar.tsx
├── lib/
│   ├── supabase.ts              ← Copy from old project
│   └── auth.ts
└── types/
    └── supabase.ts              ← Copy from old project
```

---

## 🔑 Key Technical Details

### Database Schema (Already Created)

**staff table:**
```sql
id UUID PRIMARY KEY
email TEXT UNIQUE
name TEXT
phone TEXT
point_balance INTEGER DEFAULT 0  -- Auto-calculated
is_active BOOLEAN DEFAULT true
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

**point_logs table:**
```sql
id UUID PRIMARY KEY
staff_id UUID REFERENCES staff(id)
product_id TEXT REFERENCES products(id)
points INTEGER
product_name TEXT  -- Snapshot for history
category TEXT  -- 'health' | 'cosmetic'
notes TEXT
log_date DATE DEFAULT CURRENT_DATE
created_at TIMESTAMPTZ
```

**Important:**
- Point balance updates automatically via database trigger
- When you insert into point_logs, staff.point_balance += points
- When you delete from point_logs, staff.point_balance -= points
- No manual balance calculation needed!

### Multi-Language Data Structure

Products have text in 5 languages:
```typescript
product {
  id: "prod-123",
  category: "health",
  point_value: 100,
  texts: [
    { language: "ja", name: "ビタミンC", description: "..." },
    { language: "en", name: "Vitamin C", description: "..." },
    { language: "zh", name: "维生素C", description: "..." },
    { language: "th", name: "วิตามินซี", description: "..." },
    { language: "ko", name: "비타민 C", description: "..." }
  ]
}
```

### Authentication

**Old Project (Owner):**
- Keep existing auth (username/password)
- Environment variables: PDG_AUTH_USERNAME, PDG_AUTH_PASSWORD

**New Project (Staff):**
- Simple email-based login (no password)
- Or PIN code (4-6 digits)
- Store staffId in localStorage
- No Supabase Auth needed (keep it simple)

---

## ⚠️ Important Decisions Made

1. **Keep old project as-is** - User doesn't want to relearn interface
2. **No offline features** - User explicitly said no offline needed
3. **Dual projects** - Separation of owner and staff concerns
4. **Supabase only** - No Prisma/SQLite after migration
5. **Simple staff auth** - No complex auth system needed
6. **Multi-language support** - Must maintain JA, EN, ZH, TH, KO
7. **MCP integration** - Must keep working for product translations
8. **Point logging** - Owner logs sales, staff view results
9. **Real-time sync** - Both projects share same database

---

## 📋 Next Steps (When User Says "Supabase is ready")

### Immediate Actions:

1. **Modify old project:**
   - Create Staff API routes
   - Create Staff management page
   - Add "Log Sale" button to product catalog

2. **Create new staff portal:**
   - Initialize new Next.js project
   - Copy Supabase config
   - Build login page
   - Build dashboard
   - Build history & calendar

3. **Update MCP server:**
   - Replace Prisma with Supabase

4. **Test everything:**
   - Log points in old project
   - Verify staff sees them in new project
   - Test MCP integration

5. **Deploy both:**
   - Old project to Vercel
   - New project to Vercel

**Estimated total time:** 7-9 hours of development

---

## 🎯 Success Criteria

When complete, user should be able to:

**As Owner (Old Project):**
- ✅ Manage products (existing functionality)
- ✅ View list of all staff members
- ✅ Add new staff members
- ✅ See staff point balances
- ✅ Click product → "Log Sale" → Select staff → Points assigned
- ✅ Use MCP to add/translate products

**As Staff (New Project):**
- ✅ Login with email (or PIN)
- ✅ See their point balance (big number)
- ✅ View recent transactions
- ✅ Browse full history
- ✅ View calendar of sales

**System:**
- ✅ Both projects connect to same Supabase database
- ✅ Real-time sync (staff sees points immediately)
- ✅ No offline features (all removed)
- ✅ Mobile-friendly staff portal
- ✅ Multi-language support maintained

---

## 💡 Additional Context

### Why User Rejected Full Rebuild:
- Familiar with current interface
- Doesn't want to relearn workflow
- Current product management works well
- Just needs staff features added

### Why Dual Projects:
- Clean separation of concerns
- Staff don't need product management
- Owner doesn't need simplified interface
- Easier to maintain separately
- Staff app can be mobile-optimized

### Why Supabase:
- Real-time updates
- No offline complexity
- Free tier sufficient
- Easy to scale
- Cloud-based (accessible anywhere)

---

## 📞 Current Status

**Phase 1:** ✅ COMPLETE
- Database schema created
- Supabase client configured
- Migration scripts ready
- Documentation complete

**Phase 2:** ⏳ WAITING FOR USER
- User needs to set up Supabase account
- User needs to configure .env.local
- User needs to run migrations

**Phase 3:** ⏳ READY TO START
- Once Supabase is ready, can begin implementation
- Estimated 7-9 hours to complete
- Can be done in 1-2 days

---

## 🔗 Reference Files

- `SUPABASE_SETUP_GUIDE.md` - How to set up Supabase
- `docs/DUAL_PROJECT_PLAN.md` - Detailed architecture plan
- `supabase/migrations/20250115000000_add_staff_point_system.sql` - Database schema
- `lib/supabase.ts` - Supabase client
- `types/supabase.ts` - TypeScript types
- `scripts/test-supabase-connection.ts` - Test connection
- `scripts/migrate-to-supabase.ts` - Migrate data

---

**END OF SUMMARY**

This document should give full context to continue the implementation.
