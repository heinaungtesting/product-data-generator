# MyApp Implementation Specification - Smart Approach

**Date:** 2025-01-17
**Project:** MyApp PWA Enhancement with Role-Based Features
**Status:** ✅ Ready for Implementation - Smart Approach

---

## Executive Summary

This document specifies the enhanced MyApp implementation using the **smart approach** with role-based routing. The app maintains the existing UI/UX design while adding new functionality for sales logging, point tracking, and calendar views.

**Key Principles:**
- ✅ Keep existing UI/UX design system
- ✅ Same codebase with role-based routing
- ✅ Progressive disclosure (admin sees enhanced features)
- ✅ Security-first approach (3 layers of protection)
- ✅ Simple for users, powerful for admin

---

## Architecture Decision: Smart Approach

### What This Means:

**1. Permissions (Security-First):**
- ✅ Users can LOG sales (cannot delete)
- ✅ Admin can LOG and DELETE any sales
- ✅ Users can flag errors for admin review
- ✅ Three-layer security (UI, Route, API)

**2. Display (Individual + Summary):**
- ✅ Show individual logs with timestamps
- ✅ Show summary count at top
- ✅ Clear, no grouping confusion

**3. Product Access (Read-Only for Users):**
- ✅ Users CAN access read-only product detail page
- ✅ Users see full info before logging
- ✅ Only admin sees Edit/Delete buttons

**4. Language (User Preference):**
- ✅ Users choose language on first login
- ✅ Saved to user profile
- ✅ No toggle clutter (set once)
- ✅ Admin can change any user's language

**5. UI Consistency:**
- ✅ Same design system as current project
- ✅ Same components, same feel
- ✅ Features appear/disappear based on role
- ✅ Natural, not jarring

---

## User Role Features

### 1. **Product Catalog View**

**Layout:** (Keep existing design)
```
┌─────────────────────────────────────┐
│  Products                           │
│  [🔍 Search products...]           │
│  [All] [Health] [Cosmetic]         │
├─────────────────────────────────────┤
│                                     │
│  ┌──────┐  ┌──────┐  ┌──────┐     │
│  │[Img] │  │[Img] │  │[Img] │     │
│  │ビタC │  │コラー│  │プロテ│     │
│  │健康  │  │化粧品│  │健康  │     │
│  │+10pt │  │+15pt │  │+20pt │     │
│  └──────┘  └──────┘  └──────┘     │
│                                     │
│  (Uses existing ProductCard design) │
│                                     │
└─────────────────────────────────────┘
```

**Features:**
- Grid layout (same as current project)
- Search bar (filter by product name)
- Category filter (health/cosmetic)
- Product card shows:
  - Product image
  - Product name (in user's language)
  - Category badge
  - Point value
- **Click card** → Opens product detail page (read-only)

**Language:**
- User selects language on first login
- Language saved to user profile
- Products display in selected language
- No language toggle visible

---

### 2. **Product Detail Page (Read-Only)**

**Layout:** (Keep existing design)
```
┌─────────────────────────────────────┐
│  ← Back                             │
├─────────────────────────────────────┤
│                                     │
│       ┌─────────────┐              │
│       │   Product   │              │
│       │    Image    │              │
│       │  (800x800)  │              │
│       └─────────────┘              │
│                                     │
│  ビタミンC 1000mg                  │
│  健康サプリメント                  │
│  ★★★★★ +10 points               │
│                                     │
│  説明：高品質ビタミンC...          │
│  Bundle: 60錠                      │
│  Category: 健康                    │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   [Log Sale] ✅            │   │
│  └─────────────────────────────┘   │
│                                     │
│  (No Edit/Delete buttons for user) │
│                                     │
└─────────────────────────────────────┘
```

**Features:**
- Full product information
- Image gallery (single image)
- Multi-language description (in user's language)
- Point value clearly displayed
- **"Log Sale" button** (primary action)
- No edit/delete capabilities

**Interaction:**
- Tap "Log Sale" → Confirmation dialog
- Confirm → Save to database
- Toast notification: "Logged! +10 points"
- Return to product list or stay on page

---

### 3. **Log Sale Workflow**

**Step 1: Click "Log Sale" button**
```
Dialog appears:
┌─────────────────────────┐
│ Log Sale?               │
│                         │
│ Product: ビタミンC     │
│ Points: +10             │
│                         │
│ Optional note:          │
│ [________________]      │
│                         │
│ [Cancel]  [Confirm]     │
└─────────────────────────┘
```

**Step 2: Confirm**
- Save to `point_logs` table
- Set `logged_by` = current user
- Set `log_date` = today
- Trigger auto-updates `user.point_balance`

**Step 3: Success**
```
Toast notification:
┌─────────────────────────┐
│ ✅ Sale logged!        │
│ +10 points added       │
└─────────────────────────┘

User sees updated balance immediately
```

---

### 4. **Calendar View**

**Main Feature:** Calendar showing daily point totals

**Layout:**
```
┌─────────────────────────────────────┐
│  Calendar        [Jan 2025 ▼]       │
├─────────────────────────────────────┤
│                                     │
│  Sun  Mon  Tue  Wed  Thu  Fri  Sat │
│       1    2    3    4    5    6   │
│       -    -   20pt  -   35pt  -   │
│                                     │
│   7    8    9   10   11   12   13  │
│  45pt  -    -   60pt 25pt  -    -  │
│                                     │
│  14   15   16   17   18   19   20  │
│   -   80pt  -   [35pt] -    -    - │
│            ↑ Selected date          │
│                                     │
├─────────────────────────────────────┤
│  Jan 17, 2025 - Details             │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 14:32  ビタミンC    +10pt  │   │
│  │ 10:15  ビタミンC    +10pt  │   │
│  │ 09:20  コラーゲン  +15pt  │   │
│  ├─────────────────────────────┤   │
│  │ Total:              35pts   │   │
│  └─────────────────────────────┘   │
│                                     │
│  [View All Sales This Month →]     │
│                                     │
└─────────────────────────────────────┘
```

**Features:**

**Calendar Grid:**
- Monthly view (use existing calendar component if available)
- Each date shows total points for that day
- Dates with no sales show "-"
- Current date highlighted
- Selected date highlighted differently
- Can swipe/navigate between months

**Date Details Panel:**
- Click any date → Show logs for that date
- List of all sales with:
  - Time (HH:MM format)
  - Product name
  - Points earned
- Total points for the day at bottom
- Individual logs shown (not grouped)

**Interactions:**
- Tap date → View details
- Tap product in list → View product detail
- Swipe between months
- Tap "View All Sales" → Go to full history

---

### 5. **Dashboard (Home)**

**Layout:**
```
┌─────────────────────────────────────┐
│  Welcome, Sunny 👋                  │
├─────────────────────────────────────┤
│                                     │
│  Your Points                        │
│  ┌───────────────────────────────┐ │
│  │  Today           35 pts       │ │
│  │  This Month     340 pts       │ │
│  │  All Time     1,250 pts       │ │
│  └───────────────────────────────┘ │
│                                     │
│  Quick Actions                      │
│  ┌──────────┐  ┌──────────┐       │
│  │ 📦 Log   │  │ 📅 View  │       │
│  │   Sale   │  │ Calendar │       │
│  └──────────┘  └──────────┘       │
│                                     │
│  Recent Activity                    │
│  ┌───────────────────────────────┐ │
│  │ 14:32  ビタミンC    +10pt    │ │
│  │ 10:15  ビタミンC    +10pt    │ │
│  │ 09:20  コラーゲン  +15pt    │ │
│  └───────────────────────────────┘ │
│                                     │
│  [View Full History →]              │
│                                     │
└─────────────────────────────────────┘
```

**Features:**
- Point summary (today, month, all-time)
- Quick action buttons
- Recent sales (last 5-10)
- Clear call-to-action

---

### 6. **Sales History View**

**Layout:**
```
┌─────────────────────────────────────┐
│  ← Sales History                    │
│  [Today] [Week] [Month] [All]       │
├─────────────────────────────────────┤
│                                     │
│  Jan 17, 2025 (Today)               │
│  ┌─────────────────────────────┐   │
│  │ 14:32  ビタミンC    +10pt  │   │
│  │        [Flag Error]         │   │
│  ├─────────────────────────────┤   │
│  │ 10:15  ビタミンC    +10pt  │   │
│  │        [Flag Error]         │   │
│  ├─────────────────────────────┤   │
│  │ 09:20  コラーゲン  +15pt  │   │
│  │        [Flag Error]         │   │
│  └─────────────────────────────┘   │
│  Day Total: 35 points               │
│                                     │
│  Jan 16, 2025                       │
│  ┌─────────────────────────────┐   │
│  │ 16:45  プロテイン  +20pt  │   │
│  │        [Flag Error]         │   │
│  └─────────────────────────────┘   │
│  Day Total: 20 points               │
│                                     │
└─────────────────────────────────────┘
```

**Features:**
- Filter tabs (Today, Week, Month, All)
- Individual logs with timestamps
- Day totals (summary)
- **"Flag Error" button** (not delete)
- Tap product → View product detail
- Infinite scroll or pagination

**Flag Error Workflow:**
```
User taps "Flag Error":

┌─────────────────────────┐
│ Report Error?           │
│                         │
│ Product: ビタミンC     │
│ Time: 14:32            │
│                         │
│ This will notify admin  │
│ to review this log.     │
│                         │
│ Reason (optional):      │
│ [Wrong product]         │
│                         │
│ [Cancel]  [Report]      │
└─────────────────────────┘

After report:
- Log marked as "flagged" in database
- Admin gets notification
- User sees "⚠️ Reported" badge on log
- Points remain counted until admin reviews
```

---

### 7. **Search Functionality**

**In Product Catalog:**
```
Search bar at top:
[🔍 Search products...]

User types: "ビタミン"

Results filter in real-time:
- Shows only matching products
- Searches product name in user's language
- Case-insensitive
- Fuzzy matching (optional)
```

**Search Features:**
- Real-time filtering
- Search by product name
- Highlight matching text (optional)
- Clear button (×) to reset
- Works with category filter (combined)

---

### 8. **Bottom Navigation**

**User Role Navigation:**
```
┌─────────────────────────────────────┐
│                                     │
│  [Content Area]                     │
│                                     │
├─────────────────────────────────────┤
│ [🏠]    [📦]    [📅]    [👤]       │
│ Home  Products Calendar Profile    │
└─────────────────────────────────────┘
```

**Tabs:**
1. **Home** - Dashboard
2. **Products** - Product catalog + search
3. **Calendar** - Calendar view with date details
4. **Profile** - User settings, history, logout

---

## Admin Role Features

**Admin sees ALL user features +** additional capabilities:

### 1. **Product Catalog (Enhanced)**

**Same layout, additional features:**
```
┌─────────────────────────────────────┐
│  Products              [+ New]      │ ← Create button
│  [🔍 Search products...]           │
│  [All] [Health] [Cosmetic]         │
│                                     │
│  Language: [日本語 ▼]             │ ← Language selector
├─────────────────────────────────────┤
│                                     │
│  ┌──────┐  ┌──────┐  ┌──────┐     │
│  │[Img] │  │[Img] │  │[Img] │     │
│  │ビタC │  │コラー│  │プロテ│     │
│  │[Edit]│  │[Edit]│  │[Edit]│     │ ← Edit badges
│  │+10pt │  │+15pt │  │+20pt │     │
│  └──────┘  └──────┘  └──────┘     │
│                                     │
└─────────────────────────────────────┘
```

**Admin sees:**
- [+ New] button (create product)
- Language dropdown (switch languages)
- [Edit] badges on cards
- Edit/Delete options

---

### 2. **Product Detail Page (Full Access)**

**Same layout, additional features:**
```
┌─────────────────────────────────────┐
│  ← Back          [Edit] [Delete]    │ ← Action buttons
├─────────────────────────────────────┤
│                                     │
│       ┌─────────────┐              │
│       │   Product   │              │
│       │    Image    │              │
│       └─────────────┘              │
│                                     │
│  Vitamin C 1000mg                   │
│  Health Supplement                  │
│  ★★★★★ +10 points                 │
│                                     │
│  Description: High quality...       │
│  Bundle: 60 tablets                 │
│  Category: Health                   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Log Sale for:               │   │
│  │ [Select User ▼]             │   │ ← User selector
│  │ [Log Sale]                  │   │
│  └─────────────────────────────┘   │
│                                     │
│  Sales Statistics:                  │
│  - Today: 12 sales, 120 points     │
│  - This Month: 180 sales           │
│  - All Time: 2,450 sales           │
│                                     │
└─────────────────────────────────────┘
```

**Admin can:**
- Edit product info
- Delete product
- Log sale for any user
- View sales statistics (all users)
- Change product image

---

### 3. **Calendar View (All Users)**

**Enhanced calendar:**
```
┌─────────────────────────────────────┐
│  Calendar        [Jan 2025 ▼]       │
│  View: [My Sales] [All Users ▼]     │ ← View selector
├─────────────────────────────────────┤
│                                     │
│  Sun  Mon  Tue  Wed  Thu  Fri  Sat │
│       1    2    3    4    5    6   │
│       -    -   180pt -  350pt  -   │ ← All users
│                                     │
│  Selected: Jan 5, 2025              │
├─────────────────────────────────────┤
│  All Users - Sales:                 │
│  ┌─────────────────────────────┐   │
│  │ Sunny                       │   │
│  │ 14:32  Vitamin C    +10pt   │   │
│  │ 10:15  Vitamin C    +10pt   │   │
│  │                             │   │
│  │ Mike                        │   │
│  │ 15:20  Collagen     +15pt   │   │
│  │                             │   │
│  │ Sarah                       │   │
│  │ 09:45  Protein      +20pt   │   │
│  └─────────────────────────────┘   │
│  Day Total: 65 points               │
│                                     │
└─────────────────────────────────────┘
```

**Admin can:**
- Toggle between "My Sales" and "All Users"
- See all staff sales on any date
- Click user name → View user's profile
- Click sale → Delete option available
- View aggregated totals

---

### 4. **Sales History (All Users + Delete)**

**Enhanced history:**
```
┌─────────────────────────────────────┐
│  ← Sales History                    │
│  [Today] [Week] [Month] [All]       │
│  User: [All Users ▼]                │ ← User filter
├─────────────────────────────────────┤
│                                     │
│  Jan 17, 2025 (Today)               │
│  ┌─────────────────────────────┐   │
│  │ Sunny                       │   │
│  │ 14:32  ビタミンC    +10pt  │   │
│  │              [Delete] ❌    │   │ ← Delete button
│  ├─────────────────────────────┤   │
│  │ Mike                        │   │
│  │ 15:20  コラーゲン  +15pt  │   │
│  │              [Delete] ❌    │   │
│  └─────────────────────────────┘   │
│                                     │
│  ⚠️ Flagged for Review:            │
│  ┌─────────────────────────────┐   │
│  │ Sarah (Reported by user)    │   │
│  │ 10:30  Protein      +20pt   │   │
│  │ Reason: Wrong product       │   │
│  │     [Keep]  [Delete]        │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

**Admin can:**
- View all users' sales
- Filter by specific user
- **Delete any log** (with confirmation)
- See flagged logs at top (review queue)
- Approve or delete flagged logs

**Delete Workflow:**
```
Admin taps "Delete":

┌─────────────────────────┐
│ Delete Log?             │
│                         │
│ User: Sunny             │
│ Product: ビタミンC     │
│ Points: -10             │
│                         │
│ This will reduce Sunny's│
│ point balance.          │
│                         │
│ [Cancel]  [Delete]      │
└─────────────────────────┘

After delete:
- Log removed from database
- User's point_balance auto-adjusted by trigger
- Toast: "Log deleted. Sunny's points: -10"
```

---

### 5. **User Management Page**

**New page (admin only):**
```
┌─────────────────────────────────────┐
│  ← Users                [+ New]     │
├─────────────────────────────────────┤
│  [🔍 Search users...]              │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Sunny                       │   │
│  │ 1,250 points • Active       │   │
│  │ Language: Japanese          │   │
│  │         [View] [Edit]       │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Mike                        │   │
│  │ 890 points • Active         │   │
│  │ Language: English           │   │
│  │         [View] [Edit]       │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Sarah                       │   │
│  │ 0 points • Inactive         │   │
│  │ Language: Japanese          │   │
│  │         [View] [Edit]       │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

**Features:**
- List all users
- Search by nickname
- View user details (points, history)
- Edit user (change PIN, language, activate/deactivate)
- Create new user

---

### 6. **Bottom Navigation (Admin)**

**Admin Navigation:**
```
┌─────────────────────────────────────┐
│                                     │
│  [Content Area]                     │
│                                     │
├─────────────────────────────────────┤
│ [🏠]   [📦]   [📅]  [👥]   [👤]    │
│ Home Products Calendar Users Profile│
└─────────────────────────────────────┘
```

**Extra Tab:**
- **Users** tab (user management)

---

## UI/UX Consistency

### **Keep Existing Design System**

**From Current Project:**
- ✅ Color scheme (same colors)
- ✅ Typography (same fonts)
- ✅ Spacing (same margins/padding)
- ✅ Border radius (same roundness)
- ✅ Shadows (same elevation)
- ✅ Animations (same transitions)
- ✅ Icons (same icon library)
- ✅ Button styles (same designs)

**Component Reuse:**
```
Existing components to keep:
- ProductCard
- CategoryFilter
- SearchBar
- Header
- BottomNav
- Button
- Input
- Dialog/Modal
- Toast notifications
- Loading states

New components to add:
- Calendar component
- SalesLogList
- UserCard (admin)
- FlagErrorButton
- RoleBasedView (wrapper)
```

---

## First-Time User Setup

### **Language Selection Flow**

**User first login:**
```
Step 1: Welcome Screen
┌─────────────────────────┐
│ Welcome to MyApp! 👋    │
│                         │
│ Let's set up your       │
│ account.                │
│                         │
│ [Continue →]            │
└─────────────────────────┘

Step 2: Language Selection
┌─────────────────────────┐
│ Choose your language    │
│                         │
│ ⚪ 日本語 (Japanese)   │
│ ⚪ English              │
│ ⚪ 中文 (Chinese)      │
│ ⚪ ไทย (Thai)          │
│ ⚪ 한국어 (Korean)     │
│                         │
│ [Save & Continue]       │
└─────────────────────────┘

Step 3: Tutorial (optional)
┌─────────────────────────┐
│ Quick Tour              │
│                         │
│ 1. Find products        │
│ 2. Log your sales       │
│ 3. Track your points    │
│                         │
│ [Skip] [Start Tour]     │
└─────────────────────────┘

Step 4: Dashboard
User lands on home screen
Language preference saved
```

**Saved to database:**
```sql
UPDATE users
SET language_preference = 'ja',
    onboarding_completed = true
WHERE id = user_id;
```

---

## Security Implementation

### **Three-Layer Protection**

**Layer 1: UI Level**
```typescript
// Hide features user shouldn't see
{user.role === 'admin' && (
  <Button>Edit Product</Button>
)}

{user.role === 'admin' && (
  <LanguageSelector />
)}

// User can't delete
{user.role === 'user' && (
  <Button>Flag Error</Button>
)}

// Admin can delete
{user.role === 'admin' && (
  <Button>Delete</Button>
)}
```

**Layer 2: Route Protection (Middleware)**
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const user = await getUser(request);

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/users')) {
    if (user?.role !== 'admin') {
      return NextResponse.redirect('/');
    }
  }

  // Allow detail page but control edit buttons via UI
  return NextResponse.next();
}
```

**Layer 3: API Protection**
```typescript
// app/api/logs/[id]/route.ts
export async function DELETE(req, { params }) {
  const user = await getUser(req);

  // Only admin can delete
  if (user.role !== 'admin') {
    return Response.json(
      { error: 'Unauthorized' },
      { status: 403 }
    );
  }

  // Delete log
  await supabase
    .from('point_logs')
    .delete()
    .eq('id', params.id);

  return Response.json({ success: true });
}
```

**Layer 4: Database RLS (Final Backup)**
```sql
-- Users can only insert own logs
CREATE POLICY "Users can insert own logs"
  ON point_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only admins can delete
CREATE POLICY "Only admins can delete logs"
  ON point_logs FOR DELETE
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');
```

---

## Database Additions

### **New Fields:**

**Users table:**
```sql
ALTER TABLE users
ADD COLUMN language_preference TEXT DEFAULT 'ja'
  CHECK (language_preference IN ('ja', 'en', 'zh', 'th', 'ko'));

ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;
```

**Point logs table:**
```sql
ALTER TABLE point_logs
ADD COLUMN is_flagged BOOLEAN DEFAULT false;

ADD COLUMN flag_reason TEXT;

ADD COLUMN flagged_at TIMESTAMPTZ;
```

### **Queries for Calendar:**

**Get user's sales for a specific month:**
```sql
SELECT
  log_date,
  SUM(points) as total_points,
  COUNT(*) as sale_count
FROM point_logs
WHERE user_id = $1
  AND EXTRACT(YEAR FROM log_date) = $2
  AND EXTRACT(MONTH FROM log_date) = $3
GROUP BY log_date
ORDER BY log_date;
```

**Get user's sales for a specific date:**
```sql
SELECT
  created_at,
  product_name,
  points,
  is_flagged,
  flag_reason
FROM point_logs
WHERE user_id = $1
  AND log_date = $2
ORDER BY created_at DESC;
```

**Get all users' sales for a date (admin):**
```sql
SELECT
  pl.*,
  u.nickname as user_nickname
FROM point_logs pl
JOIN users u ON pl.user_id = u.id
WHERE log_date = $1
ORDER BY u.nickname, pl.created_at DESC;
```

---

## Implementation Checklist

**Phase 1: User Features** (6 hours)
- [ ] Product catalog with search (keep existing design)
- [ ] Product detail page (read-only for users)
- [ ] Log sale functionality
- [ ] Calendar view component
- [ ] Calendar date click → Show logs
- [ ] Dashboard with point summary
- [ ] Sales history with flag error
- [ ] First-time language selection

**Phase 2: Admin Features** (4 hours)
- [ ] Role check system
- [ ] Language selector (admin only)
- [ ] Product edit/delete buttons (admin)
- [ ] Calendar all-users view
- [ ] Sales history with delete (admin)
- [ ] User management page
- [ ] Delete log functionality
- [ ] Review flagged logs

**Phase 3: Security** (2 hours)
- [ ] Route protection middleware
- [ ] API role checks
- [ ] Database RLS policies
- [ ] Test unauthorized access attempts

**Phase 4: Testing** (2 hours)
- [ ] Test user role restrictions
- [ ] Test admin full access
- [ ] Test calendar interactions
- [ ] Test search functionality
- [ ] Test flag/delete workflows
- [ ] Test on iOS and Android
- [ ] Test language selection

**Total: 14 hours**

---

## Feature Comparison Table

| Feature | User Role | Admin Role |
|---------|-----------|------------|
| View products | ✅ Yes | ✅ Yes |
| Search products | ✅ Yes | ✅ Yes |
| Product detail page | ✅ Read-only | ✅ Full access |
| Language selector | ❌ Set once on first login | ✅ Available |
| Log sales | ✅ Own sales | ✅ For any user |
| Delete logs | ❌ Flag error only | ✅ Delete any |
| Calendar view | ✅ Own sales | ✅ All users |
| Sales history | ✅ Own only | ✅ Everyone |
| Flag errors | ✅ Yes | ✅ Review flagged |
| Create/edit products | ❌ No | ✅ Yes |
| User management | ❌ No | ✅ Yes |

---

## User Stories

### **Story 1: User Logs Sale from Products**
```
1. Sunny opens MyApp
2. Taps "Products" tab
3. Searches "ビタミン"
4. Finds "ビタミンC"
5. Taps card → Detail page opens
6. Reads description to confirm
7. Taps "Log Sale" button
8. Dialog: "Log Sale? +10pts"
9. Taps "Confirm"
10. Toast: "Logged! +10 points"
11. Returns to products
```

### **Story 2: User Views Calendar**
```
1. Sunny opens MyApp
2. Taps "Calendar" tab
3. Sees January 2025 calendar
4. Dates show point totals:
   - Jan 15: 80pts
   - Jan 16: 45pts
   - Jan 17: 35pts (today)
5. Taps "Jan 15"
6. Sees detailed logs:
   - 14:30 Vitamin C +10
   - 11:20 Vitamin C +10
   - 10:15 Collagen +15
   - ...
   Total: 80pts
7. Taps a log → Opens product detail
```

### **Story 3: User Flags Error**
```
1. Sunny realizes logged wrong product
2. Opens "Profile" → "History"
3. Finds the wrong log
4. Taps "Flag Error"
5. Dialog: "Report Error?"
6. Selects reason: "Wrong product"
7. Taps "Report"
8. Toast: "Reported to admin"
9. Log shows "⚠️ Reported" badge
10. Points still counted (pending admin review)
```

### **Story 4: Admin Reviews Flagged Log**
```
1. You (admin) open MyApp
2. Badge on Profile shows "1 flagged"
3. Tap to view flagged logs
4. See Sunny's reported log
5. Read reason: "Wrong product"
6. Decide it's valid error
7. Tap "Delete"
8. Confirm deletion
9. Sunny's points adjusted automatically
10. Sunny gets notification: "Reported log resolved"
```

### **Story 5: Admin Views All Users Calendar**
```
1. You (admin) open MyApp
2. Tap "Calendar" tab
3. Toggle "All Users"
4. See combined totals:
   - Jan 15: 250pts (all staff)
   - Jan 16: 180pts
   - Jan 17: 120pts
5. Tap "Jan 17"
6. See breakdown:
   - Sunny: 35pts (3 sales)
   - Mike: 45pts (3 sales)
   - Sarah: 40pts (2 sales)
7. Tap Sunny's name → View her profile
```

---

**Status:** ✅ Ready for Implementation
**Approach:** Smart, Security-First, UI Consistent
**Estimated Time:** 14 hours

**This document provides complete specifications for MyApp development with the smart approach.**
