# MyApp Features Specification

**Date:** 2025-01-17
**Project:** MyApp PWA - User-Facing Sales Logging Application
**Status:** ✅ Ready for Implementation

---

## Executive Summary

MyApp is a mobile PWA where users log their product sales and track their points. The app has two roles (admin and user) with different access levels.

**Key Features:**
- ✅ Role-based access (admin vs user)
- ✅ Users can log and delete their own sales
- ✅ Product cards show aggregated counts (e.g., "Vitamin C x3")
- ✅ Language: Admin can toggle languages, Users fixed to Japanese
- ✅ Product details: Admin only
- ✅ Point tracking: Daily, monthly, all-time

---

## Role-Based Features

### 👤 User Role (Regular Staff)

**What Users CAN do:**

1. **Product Catalog (List View)**
   - View all products in grid/list
   - **Language:** Fixed to Japanese (no language toggle)
   - Filter by category (health/cosmetic)
   - Search products
   - See product name, category, point value
   - **Click product → Log sale directly** (no detail page)

2. **Log Sales**
   - Click product card → Confirmation dialog → Save
   - Dialog shows:
     ```
     ┌─────────────────────────┐
     │ Log Sale?               │
     │                         │
     │ Product: ビタミンC     │
     │ Points: +10             │
     │                         │
     │ [Cancel]  [Confirm]     │
     └─────────────────────────┘
     ```
   - After confirm → Points added to account
   - Toast notification: "Logged! +10 points"

3. **View Own Points Dashboard**
   - **All-time total:** 1,250 points
   - **This month:** 340 points
   - **Today:** 25 points
   - Monthly breakdown chart
   - Personal sales calendar

4. **Sales History (Own Sales Only)**
   - View own logged sales
   - **Product count aggregation:**
     ```
     Today's Sales:
     ┌─────────────────────────────┐
     │ ビタミンC        x3  30pts │
     │ コラーゲン      x2  30pts │
     │ プロテイン      x1  20pts │
     ├─────────────────────────────┤
     │ Total Today:         80pts │
     └─────────────────────────────┘
     ```
   - When same product logged multiple times, show count and multiplied points
   - Delete own logs (swipe or delete button)
   - Filter by date range

5. **Calendar View**
   - Monthly calendar showing daily point totals
   - Click date → See that day's sales with product counts
   - Example:
     ```
     Jan 15, 2025
     ┌─────────────────────────────┐
     │ ビタミンC        x5  50pts │
     │ コラーゲン      x3  45pts │
     └─────────────────────────────┘
     Total: 95 points
     ```

**What Users CANNOT do:**
- ❌ Cannot access product detail page
- ❌ Cannot toggle language (fixed to Japanese)
- ❌ Cannot edit products
- ❌ Cannot view other users' data
- ❌ Cannot create/edit/delete products
- ❌ Cannot manage users

---

### 👑 Admin Role (You)

**What Admins CAN do:**

1. **Product Catalog (Full Access)**
   - View all products
   - **Language toggle available** (JA, EN, ZH, TH, KO)
   - Filter by category
   - Search products
   - **Click product → Open detail page** ✅

2. **Product Detail Page (Admin Only)**
   - View product image
   - View multi-language descriptions
   - Edit product button
   - Delete product button
   - Log sale for any user
   - See sales history for this product

3. **Log Sales**
   - Same as users, but can log for any user
   - Can select which user to log for:
     ```
     ┌─────────────────────────┐
     │ Log Sale                │
     │                         │
     │ Product: Vitamin C      │
     │ Points: +10             │
     │                         │
     │ For User: [Sunny ▼]    │
     │                         │
     │ [Cancel]  [Confirm]     │
     └─────────────────────────┘
     ```

4. **View All Data**
   - See all users' points
   - See all sales logs (all users)
   - **Product count aggregation for all users:**
     ```
     All Users - Today:
     ┌─────────────────────────────┐
     │ Vitamin C        x12 120pts│
     │ Collagen         x8  120pts│
     │ Protein          x5  100pts│
     └─────────────────────────────┘
     ```

5. **Product Management**
   - Create new product (+ button)
   - Edit any product
   - Delete products
   - Upload/change product images

6. **Delete Logs**
   - Delete any log (own or others)
   - Useful for correcting mistakes

**Admins have ALL user features + admin features**

---

## Product Count Aggregation Logic

### When to Show Count:

**Rule:** When the same product appears 2 or more times in the same view, show count.

**Example Views:**

**Today's Sales (Single User):**
```
If user logged:
- 9am: Vitamin C (+10)
- 10am: Vitamin C (+10)
- 2pm: Collagen (+15)
- 4pm: Vitamin C (+10)

Display as:
┌─────────────────────────────┐
│ ビタミンC        x3  30pts │
│ コラーゲン      x1  15pts │
├─────────────────────────────┤
│ Total:               45pts │
└─────────────────────────────┘
```

**This Month (Single User):**
```
If user logged Vitamin C 23 times this month:

Display as:
┌─────────────────────────────┐
│ ビタミンC       x23 230pts │
│ コラーゲン     x15 225pts │
│ プロテイン      x8 160pts │
├─────────────────────────────┤
│ Total:              615pts │
└─────────────────────────────┘
```

**All Users Today (Admin View):**
```
All staff combined:

┌─────────────────────────────┐
│ Vitamin C       x45 450pts │
│ Collagen        x32 480pts │
│ Protein         x18 360pts │
└─────────────────────────────┘
```

### Implementation Details:

**Database Query:**
```typescript
// Get user's sales for today, grouped by product
const { data: todaySales } = await supabase
  .from('point_logs')
  .select('product_id, product_name, points, COUNT(*) as count')
  .eq('user_id', userId)
  .eq('log_date', today)
  .group('product_id, product_name, points');

// Result:
// [
//   { product_name: 'ビタミンC', points: 10, count: 3 },
//   { product_name: 'コラーゲン', points: 15, count: 1 }
// ]

// Display:
todaySales.map(item => ({
  name: item.product_name,
  count: item.count,
  pointsEach: item.points,
  total: item.points * item.count
}));
```

**UI Component:**
```typescript
interface SalesSummaryItem {
  productName: string;
  count: number;
  pointsPerUnit: number;
  totalPoints: number;
}

// Display
{sales.map(item => (
  <div className="flex justify-between">
    <span>{item.productName}</span>
    <span>x{item.count}</span>
    <span>{item.totalPoints}pts</span>
  </div>
))}
```

---

## User Interface Details

### 1. Product Catalog (User View)

```
┌─────────────────────────────────────┐
│  Products                           │
│  [🔍 Search...]                    │
│  [All] [Health] [Cosmetic]         │
├─────────────────────────────────────┤
│                                     │
│  ┌──────┐  ┌──────┐  ┌──────┐     │
│  │ビタC │  │コラー│  │プロテ│     │
│  │健康  │  │化粧品│  │健康  │     │
│  │+10pt │  │+15pt │  │+20pt │     │
│  └──────┘  └──────┘  └──────┘     │
│                                     │
│  Tap card → Log sale dialog        │
│                                     │
└─────────────────────────────────────┘

NO language toggle visible (fixed Japanese)
NO detail page access
```

### 2. Product Catalog (Admin View)

```
┌─────────────────────────────────────┐
│  Products              [JA ▼]       │ ← Language toggle
│  [🔍 Search...]        [+ New]      │ ← Create button
│  [All] [Health] [Cosmetic]         │
├─────────────────────────────────────┤
│                                     │
│  ┌──────┐  ┌──────┐  ┌──────┐     │
│  │Vit C │  │Collag│  │Protein│    │
│  │Health│  │Cosmtc│  │Health│     │
│  │+10pt │  │+15pt │  │+20pt │     │
│  │[Edit]│  │[Edit]│  │[Edit]│     │
│  └──────┘  └──────┘  └──────┘     │
│                                     │
│  Tap card → Product detail page    │
│                                     │
└─────────────────────────────────────┘

Language toggle available
Detail page accessible
Edit buttons visible
```

### 3. Product Detail Page (Admin Only)

```
┌─────────────────────────────────────┐
│  ← Back              [Edit] [Delete]│
├─────────────────────────────────────┤
│                                     │
│       ┌─────────────┐              │
│       │   Product   │              │
│       │    Image    │              │
│       └─────────────┘              │
│                                     │
│  Vitamin C                          │
│  健康 • 10 points                   │
│                                     │
│  High-quality vitamin C supplement  │
│  for daily health support...        │
│                                     │
│  [Log Sale for User ▼]             │
│                                     │
│  Sales History (All Users):         │
│  ┌─────────────────────────────┐   │
│  │ Today:      x12    120pts   │   │
│  │ This Week:  x45    450pts   │   │
│  │ This Month: x180  1800pts   │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### 4. User Dashboard

```
┌─────────────────────────────────────┐
│  Welcome, Sunny                     │
├─────────────────────────────────────┤
│                                     │
│  Your Points                        │
│  ┌─────────────────────────────┐   │
│  │  Today          25 pts      │   │
│  │  This Month    340 pts      │   │
│  │  All Time    1,250 pts      │   │
│  └─────────────────────────────┘   │
│                                     │
│  Today's Sales:                     │
│  ┌─────────────────────────────┐   │
│  │ ビタミンC    x2    20pts    │   │
│  │ コラーゲン  x1    15pts    │   │
│  │ ─────────────────────────   │   │
│  │ Total:             35pts    │   │
│  └─────────────────────────────┘   │
│                                     │
│  [View Full History]                │
│  [Calendar View]                    │
│                                     │
└─────────────────────────────────────┘
```

### 5. Sales History Page

```
┌─────────────────────────────────────┐
│  ← Sales History                    │
│  [Today] [This Week] [This Month]   │
├─────────────────────────────────────┤
│                                     │
│  Jan 17, 2025 (Today)               │
│  ┌─────────────────────────────┐   │
│  │ ビタミンC    x3    30pts    │   │
│  │ 14:32, 10:15, 09:20         │   │
│  │                     [Delete] │   │
│  ├─────────────────────────────┤   │
│  │ コラーゲン  x2    30pts    │   │
│  │ 13:45, 11:30                │   │
│  │                     [Delete] │   │
│  └─────────────────────────────┘   │
│                                     │
│  Jan 16, 2025                       │
│  ┌─────────────────────────────┐   │
│  │ プロテイン  x5   100pts    │   │
│  │                     [Delete] │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘

Swipe left on item → Delete option
Click product group → Expand to see individual logs
```

### 6. Delete Log Functionality

**User View:**
```typescript
// User can delete own logs
const deleteLog = async (logId: string) => {
  const { error } = await supabase
    .from('point_logs')
    .delete()
    .eq('id', logId)
    .eq('user_id', currentUser.id); // Only own logs

  if (!error) {
    toast.success('Log deleted. Points adjusted.');
  }
};
```

**Admin View:**
```typescript
// Admin can delete any log
const deleteLog = async (logId: string) => {
  const { error } = await supabase
    .from('point_logs')
    .delete()
    .eq('id', logId);
    // No user_id filter - can delete any log

  if (!error) {
    toast.success('Log deleted. User points adjusted.');
  }
};
```

**Delete Confirmation:**
```
┌─────────────────────────┐
│ Delete Log?             │
│                         │
│ Product: ビタミンC     │
│ Points: -10             │
│                         │
│ This will reduce your   │
│ point balance.          │
│                         │
│ [Cancel]  [Delete]      │
└─────────────────────────┘
```

---

## Navigation Flow

### User Role Navigation:

```
Login → Product Catalog (Japanese, no detail access)
         ↓
         Tap Product → Log Sale Dialog → Confirm → Done

        [Bottom Nav]
        - Products (catalog)
        - Dashboard (points)
        - History (sales with counts)
        - Calendar
        - Profile
```

### Admin Role Navigation:

```
Login → Product Catalog (Language toggle, can access details)
         ↓
         Option 1: Tap Product → Detail Page → Edit/Delete/Log Sale
         Option 2: + Button → Create Product

        [Bottom Nav]
        - Products (catalog)
        - Dashboard (all users)
        - History (all sales)
        - Users (manage)
        - Profile
```

---

## Language Settings

### User Role:
- **Fixed Language:** Japanese (ja)
- All product names shown in Japanese
- All UI text in Japanese
- No language toggle button visible
- Language preference stored in user profile (default: 'ja')

### Admin Role:
- **Language Toggle:** Top-right corner
- Options: JA | EN | ZH | TH | KO
- Switches all product names and descriptions
- UI text remains in English (admin interface)
- Preference saved per session

**Implementation:**
```typescript
// User login - set language
if (user.role === 'user') {
  setLanguage('ja'); // Fixed
  hideLanguageToggle();
} else if (user.role === 'admin') {
  setLanguage(localStorage.getItem('adminLang') || 'en');
  showLanguageToggle();
}

// Fetch products with language
const { data: products } = await supabase
  .from('products')
  .select(`
    *,
    product_texts!inner(*)
  `)
  .eq('product_texts.language', currentLanguage);
```

---

## Remaining MyApp Features (Unchanged)

These features stay exactly as they are in the current MyApp:

1. **PWA Functionality**
   - Install to home screen
   - App icon and splash screen
   - Works on iOS and Android

2. **Authentication**
   - Login with nickname + PIN
   - Session management
   - Logout functionality

3. **UI/UX**
   - Material Design / Existing design system
   - Responsive mobile layout
   - Smooth animations
   - Toast notifications

4. **Performance**
   - Fast loading
   - Optimized images
   - Minimal data usage

5. **Error Handling**
   - Network error messages
   - Validation messages
   - Retry mechanisms

---

## Database Queries for Product Counts

### Get Today's Sales with Counts (User):

```sql
SELECT
  product_id,
  product_name,
  points,
  COUNT(*) as count,
  SUM(points) as total_points
FROM point_logs
WHERE user_id = $1
  AND log_date = CURRENT_DATE
GROUP BY product_id, product_name, points
ORDER BY product_name;
```

### Get This Month's Sales with Counts (User):

```sql
SELECT
  product_id,
  product_name,
  points,
  COUNT(*) as count,
  SUM(points) as total_points
FROM point_logs
WHERE user_id = $1
  AND EXTRACT(YEAR FROM log_date) = EXTRACT(YEAR FROM CURRENT_DATE)
  AND EXTRACT(MONTH FROM log_date) = EXTRACT(MONTH FROM CURRENT_DATE)
GROUP BY product_id, product_name, points
ORDER BY total_points DESC;
```

### Get All Users Today (Admin):

```sql
SELECT
  product_id,
  product_name,
  points,
  COUNT(*) as count,
  SUM(points) as total_points,
  COUNT(DISTINCT user_id) as unique_users
FROM point_logs
WHERE log_date = CURRENT_DATE
GROUP BY product_id, product_name, points
ORDER BY count DESC;
```

### Get Individual Logs for Deletion:

```sql
-- User view (own logs only)
SELECT *
FROM point_logs
WHERE user_id = $1
  AND log_date = $2
ORDER BY created_at DESC;

-- Admin view (all logs)
SELECT
  pl.*,
  u.nickname as user_nickname
FROM point_logs pl
JOIN users u ON pl.user_id = u.id
WHERE log_date = $1
ORDER BY created_at DESC;
```

---

## Feature Comparison Table

| Feature | User Role | Admin Role |
|---------|-----------|------------|
| View product catalog | ✅ Japanese only | ✅ All languages |
| Language toggle | ❌ Fixed to Japanese | ✅ Available |
| Product detail page | ❌ Not accessible | ✅ Full access |
| Log sales | ✅ Own sales | ✅ For any user |
| Delete logs | ✅ Own logs | ✅ Any log |
| View point balance | ✅ Own points | ✅ All users |
| Product count aggregation | ✅ Own sales | ✅ All users |
| Sales history | ✅ Own history | ✅ All history |
| Calendar view | ✅ Own calendar | ✅ All users |
| Create products | ❌ No | ✅ Yes |
| Edit products | ❌ No | ✅ Yes |
| Delete products | ❌ No | ✅ Yes |
| Manage users | ❌ No | ✅ Yes |

---

## Implementation Checklist

**Phase 1: Role-Based Access** (2 hours)
- [ ] Implement role check on login
- [ ] Hide/show language toggle based on role
- [ ] Restrict product detail page to admin only
- [ ] Set default language to Japanese for users

**Phase 2: Product Count Aggregation** (3 hours)
- [ ] Create database queries for grouped sales
- [ ] Build UI component for sales summary
- [ ] Implement count display (x2, x3, etc.)
- [ ] Calculate and show multiplied points
- [ ] Add to dashboard, history, and calendar views

**Phase 3: Delete Log Functionality** (2 hours)
- [ ] Add delete button to sales history items
- [ ] Implement swipe-to-delete gesture
- [ ] Add confirmation dialog
- [ ] Handle point recalculation (trigger does this)
- [ ] Show success/error messages

**Phase 4: Log Sale Workflow** (2 hours)
- [ ] User: Click card → Dialog → Confirm
- [ ] Admin: Click card → Detail page or log dialog
- [ ] Admin: Select user dropdown in log dialog
- [ ] Both: Save to database
- [ ] Both: Update UI immediately

**Phase 5: Testing** (1 hour)
- [ ] Test user role restrictions
- [ ] Test admin full access
- [ ] Test product count calculations
- [ ] Test delete functionality
- [ ] Test language settings
- [ ] Test on iOS and Android

**Total Time: 10 hours**

---

## Example User Stories

### Story 1: User Logs Sales
```
As a user (Sunny),
1. I login to MyApp with nickname + PIN
2. I see product catalog in Japanese
3. I tap "ビタミンC" card
4. Dialog asks "Log Sale? +10pts"
5. I tap "Confirm"
6. Toast shows "Logged! +10pts"
7. I see my dashboard updated: "Today: 10pts"
```

### Story 2: User Views History with Counts
```
As a user (Sunny),
1. I sold Vitamin C 3 times today
2. I sold Collagen 2 times today
3. I open "History" tab
4. I see:
   - ビタミンC x3  30pts
   - コラーゲン x2  30pts
   - Total: 60pts
5. I can tap to expand and see individual log times
6. I can swipe to delete incorrect logs
```

### Story 3: Admin Accesses Product Details
```
As an admin,
1. I login to MyApp
2. I see language toggle at top-right
3. I switch to English
4. I tap "Vitamin C" card
5. Product detail page opens
6. I see full description, image, edit button
7. I can log a sale for any user from here
```

### Story 4: Admin Views All User Sales
```
As an admin,
1. I open "Dashboard"
2. I see "All Users - Today"
3. I see:
   - Vitamin C x12  120pts (sold by all staff)
   - Collagen x8   120pts
   - Protein x5    100pts
4. I can click to see which users sold what
```

---

**Status:** ✅ Ready for Implementation
**This document provides complete specifications for MyApp development.**
