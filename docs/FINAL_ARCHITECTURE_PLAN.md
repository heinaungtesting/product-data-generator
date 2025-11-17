# Final Architecture Plan: Dual Project Approach

## Decision: Two Separate Projects, One Database

**Date:** 2025-01-17
**Architecture:** Dual Project with Shared Supabase Database

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE DATABASE                        │
│  ┌──────────┐  ┌────────────┐  ┌───────┐  ┌──────────┐    │
│  │ products │  │ point_logs │  │ staff │  │   tags   │    │
│  └──────────┘  └────────────┘  └───────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────┘
         ↑                                    ↑
         │                                    │
    ┌────┴────────┐                    ┌─────┴──────┐
    │             │                    │            │
┌───────────┐  ┌──────────────┐  ┌──────────────┐  │
│  Owner    │  │ Old Project  │  │ Staff Portal │  │
│   (You)   │→ │  (Desktop)   │  │   (Mobile)   │←─┤
└───────────┘  └──────────────┘  └──────────────┘  │
               • Product mgmt   • View products    │
               • Offline sync   • Log sales        │
               • All languages  • One language     │
               • Staff accounts • View points      │
               • Everything     • History/Calendar │
                  untouched!                       │
                                              Staff Users
```

---

## Project 1: product-data-generator (OLD - Your Project)

### Status: **MINIMAL CHANGES - Keep Everything Working**

### What Stays:
- ✅ All offline features (Service Worker, IndexedDB, bundle sync)
- ✅ All 5 language support with toggle
- ✅ Product details page
- ✅ Product editing, creation, deletion
- ✅ Tag management
- ✅ MCP server integration
- ✅ Current Prisma/SQLite setup (keep as backup)

### What We Add (Small additions only):
1. **Supabase integration** (alongside existing Prisma)
2. **Staff management page** (`app/(owner)/staff/page.tsx`)
   - Create staff accounts (nickname + PIN)
   - View staff points
   - See recent sales logs
   - Activate/deactivate accounts
3. **Optional: Manual point adjustment** (if staff forgets to log)

### Changes Required:
```
app/
├── (owner)/
│   └── staff/              ← NEW: Staff management page
│       └── page.tsx
├── api/
│   └── staff/              ← NEW: Staff CRUD APIs
│       ├── route.ts
│       └── [id]/
│           └── route.ts
└── components/
    └── StaffManagementTable.tsx  ← NEW component
```

**Estimate:** 2-3 hours of work
**Risk:** Very low - we're only adding, not removing

---

## Project 2: product-staff-portal (NEW - Staff Project)

### Status: **BUILD FROM SCRATCH - Copy UI Components**

### What It Has:
- ✅ Clean Next.js 15 project
- ✅ Login page (nickname + PIN)
- ✅ Product catalog (copied from old project)
- ✅ Click product → Log sale
- ✅ Points dashboard
- ✅ Sales history
- ✅ Calendar view
- ✅ Supabase client only (no Prisma, no SQLite, no offline)

### UI Components to Copy:
```
FROM old project → TO staff portal:

components/
├── ProductCard.tsx         → components/ProductCard.tsx
├── ProductGrid.tsx         → components/ProductGrid.tsx
├── CategoryFilter.tsx      → components/CategoryFilter.tsx
└── styles (Tailwind)       → Keep same design system

Modify for staff portal:
- Remove language toggle
- Remove edit buttons
- Remove "View Details" link
- Add "Log Sale" click handler
- Add point badge display
```

### New Components to Build:
```
components/
├── LoginForm.tsx           ← Staff login
├── PointsBadge.tsx         ← Display current points
├── LogSaleDialog.tsx       ← Confirm sale popup
├── SalesHistory.tsx        ← Transaction list
└── PointsCalendar.tsx      ← Calendar view
```

### Route Structure:
```
app/
├── login/
│   └── page.tsx            ← Staff login
├── page.tsx                ← Product catalog (click to log)
├── history/
│   └── page.tsx            ← Sales history
└── calendar/
    └── page.tsx            ← Calendar view

middleware.ts               ← Protect routes (require login)
```

**Estimate:** 4-5 hours of work
**Risk:** Low - fresh project, no legacy code

---

## Database Schema (Supabase - Shared)

### Tables:

```sql
-- Products (existing, managed by owner)
products
├── id (text, PK)
├── category ('health' | 'cosmetic')
├── point_value (integer)
├── is_active (boolean)
└── timestamps

-- Product texts (5 languages)
product_texts
├── id (uuid, PK)
├── product_id (FK → products)
├── language ('ja' | 'en' | 'zh' | 'th' | 'ko')
├── name, description, bundle_size
└── timestamps

-- Staff accounts (managed by owner)
staff
├── id (uuid, PK)
├── nickname (text, unique)      ← Display name
├── pin_hash (text)              ← Hashed PIN
├── point_balance (integer)      ← Auto-calculated
├── is_active (boolean)          ← Owner can disable
└── timestamps

-- Point logs (created by staff)
point_logs
├── id (uuid, PK)
├── staff_id (FK → staff)
├── product_id (FK → products)
├── points (integer)             ← Copied from product
├── product_name (text)          ← Snapshot
├── category ('health' | 'cosmetic')
├── notes (text, optional)       ← Staff can add note
├── log_date (date)              ← When sold
└── created_at (timestamp)       ← When logged
```

**Database trigger automatically updates `staff.point_balance` when logs are added/deleted.**

---

## Implementation Steps

### Phase 1: Supabase Setup ✅ (Already Done)
- [x] Database schema created
- [x] Migration SQL ready
- [x] TypeScript types generated
- [x] Supabase client configured
- [x] Test scripts ready

**Next:** User needs to create Supabase account

---

### Phase 2: Modify Old Project (2-3 hours)

**After user sets up Supabase:**

1. **Add Staff Management Page** (1 hour)
   - `app/(owner)/staff/page.tsx`
   - Table showing all staff
   - Create new staff (nickname + PIN)
   - Toggle active/inactive
   - View point balance

2. **Add Staff API Routes** (1 hour)
   - `app/api/staff/route.ts` - List/Create
   - `app/api/staff/[id]/route.ts` - Update/Delete
   - Hash PINs with bcrypt

3. **Testing** (30 min)
   - Create test staff account
   - Verify PIN hashing
   - Check Supabase data

**Result:** Owner can manage staff accounts

---

### Phase 3: Build Staff Portal (4-5 hours)

**Steps:**

1. **Create New Next.js Project** (15 min)
```bash
npx create-next-app@latest product-staff-portal
cd product-staff-portal
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs bcryptjs
npm install -D @types/bcryptjs
```

2. **Copy Supabase Config** (10 min)
   - Copy `lib/supabase.ts`
   - Copy `types/supabase.ts`
   - Copy `.env.local` (same credentials)

3. **Copy UI Components** (1 hour)
   - Copy `ProductCard.tsx` → Modify for logging
   - Copy `ProductGrid.tsx` → Remove edit features
   - Copy category filter if needed
   - Keep same Tailwind styles

4. **Build Login System** (1 hour)
   - `app/login/page.tsx` - Login form
   - `middleware.ts` - Protect routes
   - Session management (cookies or localStorage)

5. **Build Product Catalog** (1 hour)
   - `app/page.tsx` - Show products
   - Click product → Open LogSaleDialog
   - Confirm → Save to point_logs
   - Show success toast
   - Update points display

6. **Build History Page** (45 min)
   - `app/history/page.tsx`
   - List all staff's point_logs
   - Filter by date range
   - Show product name, points, date

7. **Build Calendar Page** (45 min)
   - `app/calendar/page.tsx`
   - Calendar view with daily point totals
   - Click date → Show logs for that day

8. **Testing & Polish** (30 min)
   - Test login flow
   - Test logging sales
   - Test points calculation
   - Mobile responsive check

**Result:** Staff can log sales and view points

---

### Phase 4: Testing & Deployment (1 hour)

1. **Test Old Project**
   - Create staff account
   - Verify it appears in Supabase
   - All old features still work

2. **Test Staff Portal**
   - Login with created account
   - View products
   - Log sale → Check points update
   - Check history shows correctly

3. **Test Database Sync**
   - Log sale in staff portal
   - Check owner project sees the log
   - Verify point balance matches

4. **Deploy Both Projects**
   - Old project → Vercel (existing deployment)
   - Staff portal → New Vercel project
   - Both use same Supabase

**Result:** Both projects live and working

---

## Key Technical Decisions

### 1. Authentication (Staff Portal)

**Approach:** Simple session-based auth

```typescript
// Staff login
const { data: staff } = await supabase
  .from('staff')
  .select('*')
  .eq('nickname', nickname)
  .eq('is_active', true)
  .single();

if (staff && await bcrypt.compare(pin, staff.pin_hash)) {
  // Set session cookie
  cookies().set('staff_session', staff.id, {
    httpOnly: true,
    secure: true,
    maxAge: 60 * 60 * 8, // 8 hours
  });
}
```

**Why not Supabase Auth?**
- No email/OAuth needed
- Simpler for staff
- Full control over session

### 2. Language Display (Staff Portal)

**Decision:** Show one primary language

**Options:**
- A: Japanese only (if staff are Japanese)
- B: English only (international)
- C: Let staff choose on first login
- D: Show all 5 languages on card (like old project)

**Recommendation:** Option C - Let staff choose once, save preference

### 3. Sale Logging Flow

**Decision:** Quick confirm dialog

```
Staff clicks product
      ↓
Dialog opens:
┌─────────────────────────┐
│ Log Sale?               │
│                         │
│ Product: ビタミンC     │
│ Points: +10             │
│                         │
│ [Cancel]  [Confirm]     │
└─────────────────────────┘
      ↓
Confirm → Save → Toast notification
```

**Why not instant?** Prevents accidental clicks
**Why not quantity?** Can add later if needed (start simple)

### 4. Owner Monitoring

**Owner can:**
- View all staff accounts
- See real-time sales logs (query point_logs table)
- Activate/deactivate staff
- Manually adjust points (create point_log with product_id = null)

**Owner cannot (by design):**
- See staff PINs (hashed)
- Delete point_logs (immutable history)

---

## File Structure Summary

### Old Project (product-data-generator)
```
product-data-generator/
├── app/
│   ├── (owner)/
│   │   ├── page.tsx          ← Existing product catalog
│   │   ├── products/         ← Existing product management
│   │   └── staff/            ← NEW: Staff management
│   │       └── page.tsx
│   └── api/
│       └── staff/            ← NEW: Staff APIs
│           ├── route.ts
│           └── [id]/route.ts
├── lib/
│   └── supabase.ts           ← NEW: Supabase client
├── types/
│   └── supabase.ts           ← NEW: Database types
└── [All existing files unchanged]
```

### New Project (product-staff-portal)
```
product-staff-portal/
├── app/
│   ├── login/
│   │   └── page.tsx          ← Staff login
│   ├── page.tsx              ← Product catalog (log sales)
│   ├── history/
│   │   └── page.tsx          ← Sales history
│   ├── calendar/
│   │   └── page.tsx          ← Calendar view
│   └── layout.tsx            ← Points badge in header
├── components/
│   ├── ProductCard.tsx       ← Copied & modified
│   ├── ProductGrid.tsx       ← Copied
│   ├── LoginForm.tsx         ← New
│   ├── LogSaleDialog.tsx     ← New
│   ├── PointsBadge.tsx       ← New
│   ├── SalesHistory.tsx      ← New
│   └── PointsCalendar.tsx    ← New
├── lib/
│   └── supabase.ts           ← Copied from old project
├── types/
│   └── supabase.ts           ← Copied from old project
├── middleware.ts             ← Auth protection
└── package.json              ← Next.js 15 + Supabase
```

---

## Timeline

| Phase | Task | Time | Status |
|-------|------|------|--------|
| 1 | Supabase setup (User) | 15 min | ✅ Ready (waiting for user) |
| 2 | Modify old project | 2-3 hrs | ⏸️ Pending Supabase |
| 3 | Build staff portal | 4-5 hrs | ⏸️ Pending Phase 2 |
| 4 | Testing & deployment | 1 hr | ⏸️ Pending Phase 3 |
| **Total** | **End-to-end** | **7-9 hrs** | - |

---

## Benefits of This Approach

✅ **Zero risk to old project** - Stays working exactly as before
✅ **Clean separation** - Staff can't access owner features
✅ **Shared database** - Real-time sync, no duplication
✅ **Reused UI** - Consistent design, faster development
✅ **Scalable** - Easy to add features to either project
✅ **Independent deployment** - Update one without affecting other
✅ **Simple for staff** - Just login and log sales

---

## Next Steps

**For You (Now):**
1. Follow `QUICK_START.md` to set up Supabase account (15 min)
2. Add API keys to `.env.local`
3. Run `npm install`
4. Run `npx supabase db push`
5. Run test script to verify connection
6. Say "Supabase is ready"

**For Claude (After Supabase ready):**
1. Modify old project - Add staff management
2. Create new staff portal project
3. Copy UI components
4. Build login, catalog, history, calendar
5. Test everything
6. Deploy both projects

---

## Questions & Answers

**Q: Can I still use my old project while staff portal is being built?**
A: Yes! Old project works independently. We only add features, never remove.

**Q: What if I want to change staff portal UI later?**
A: Easy - it's a separate project. Change whatever you want without affecting old project.

**Q: Can I add features to staff portal later?**
A: Yes! Examples: Export reports, leaderboard, rewards, notifications, etc.

**Q: Do I need to maintain two codebases?**
A: For product data changes, you only edit old project. Staff portal just reads from database.

**Q: What if staff forgets to log a sale?**
A: You can manually add a point log from owner project's staff management page.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Old project breaks | Very Low | High | Git branch + backup |
| Staff portal bugs | Medium | Low | Doesn't affect old project |
| Database connection issues | Low | Medium | Test scripts + error handling |
| Staff abuse logging | Medium | Medium | Owner monitoring + limits |
| Supabase costs | Low | Low | Free tier supports 500MB + 50K rows |

---

## Success Criteria

✅ Old project works exactly as before
✅ Staff can login with nickname + PIN
✅ Staff can see products (one language)
✅ Staff can log sales with one click
✅ Points auto-calculate correctly
✅ Staff can view history and calendar
✅ Owner can manage staff accounts
✅ Owner can see all sales logs
✅ Both projects sync via Supabase in real-time

---

**Status:** Ready to implement when Supabase is set up
**Last Updated:** 2025-01-17
**Architecture:** Approved ✅
