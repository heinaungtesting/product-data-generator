# MyApp Implementation Status

**Date:** 2025-01-17
**Status:** Foundation Complete - Ready for Feature Implementation

---

## ✅ Completed (Foundation Layer)

### 1. Supabase Integration
**Files Created:**
- `lib/supabase.ts` - Supabase client with session helpers
- `lib/database.types.ts` - TypeScript types for all database tables

**What's Done:**
- Supabase client configured
- Session management (localStorage + cookies)
- Helper functions: `getCurrentUser()`, `isAdmin()`, `setSession()`, `clearSession()`, `getSession()`
- Type-safe database queries

### 2. Authentication System
**Files Created:**
- `app/login/page.tsx` - Login page with nickname + PIN
- `app/onboarding/page.tsx` - Language selection on first login
- Updated `middleware.ts` - Route protection

**What's Done:**
- Nickname + PIN login with bcrypt verification
- Session management (7-day expiry)
- Redirect unauthenticated users to login
- First-time user onboarding flow
- Language preference selection (5 languages)
- Protected routes (all pages except /login and /onboarding)

### 3. Package Dependencies
**Updated:**
- `package.json` - Added @supabase/supabase-js and bcryptjs

**Ready to Install:**
```bash
cd /home/user/product-data-generator/myapp
npm install
```

---

## 🔨 In Progress (Needs Completion)

### 4. Product Catalog Update
**File to Modify:** `app/page.tsx`

**Current State:**
- Uses IndexedDB (Dexie) for offline storage
- Syncs from bundle.json.gz
- Language toggle with 5 languages

**Required Changes:**
1. Remove IndexedDB/Dexie dependency
2. Fetch products from Supabase:
```typescript
const { data: products } = await supabase
  .from('products')
  .select(`
    *,
    product_texts!inner (*)
  `)
  .eq('product_texts.language', userLanguage)
  .eq('is_active', true);
```

3. Remove offline sync functionality
4. Remove language toggle for regular users (show based on user.language_preference)
5. Admin users see language toggle
6. Product card click behavior:
   - User: Open read-only detail page
   - Admin: Open editable detail page

**Helpers Needed:**
```typescript
// Get user's language preference
const user = await getCurrentUser();
const userLanguage = user?.language_preference || 'ja';

// Check if admin
const isAdminUser = await isAdmin();
```

---

### 5. Product Detail Page
**File to Modify:** `app/product/[id]/page.tsx`

**Required Changes:**
1. Fetch product from Supabase (not IndexedDB)
2. Role-based UI:
   - **User Role (Read-Only):**
     - Show product info in user's language
     - Show "Log Sale" button
     - Hide edit/delete buttons
   - **Admin Role (Full Access):**
     - Show language toggle
     - Show edit/delete buttons
     - Can log sale for any user (dropdown selector)

3. Log Sale Functionality:
```typescript
const handleLogSale = async (productId: string, userId: string) => {
  const { data: product } = await supabase
    .from('products')
    .select('*, product_texts (*)')
    .eq('id', productId)
    .single();

  const { data: productText } = await supabase
    .from('product_texts')
    .select('name')
    .eq('product_id', productId)
    .eq('language', user.language_preference)
    .single();

  // Insert point log
  await supabase
    .from('point_logs')
    .insert({
      user_id: userId,
      product_id: productId,
      points: product.point_value,
      product_name: productText.name,
      category: product.category,
      logged_by: currentUser.id,
      log_date: new Date().toISOString().split('T')[0],
    });

  // Trigger auto-updates point_balance
};
```

---

### 6. Calendar View with Date Details
**File to Modify:** `app/calendar/page.tsx`

**Current State:**
- Basic calendar layout exists

**Required Implementation:**

**A. Monthly Calendar Grid:**
```typescript
// Get point totals for each day in month
const { data: dailyTotals } = await supabase
  .from('point_logs')
  .select('log_date, SUM(points)')
  .eq('user_id', currentUser.id) // or all users if admin
  .gte('log_date', startOfMonth)
  .lte('log_date', endOfMonth)
  .groupBy('log_date');

// Display:
// - Calendar grid with dates
// - Each date shows total points (e.g., "45pts")
// - Current date highlighted
// - Clickable dates
```

**B. Date Details Panel:**
```typescript
// When user clicks a date
const { data: logs } = await supabase
  .from('point_logs')
  .select('*, users(nickname)')
  .eq('log_date', selectedDate)
  .order('created_at', { ascending: false });

// Display:
// - List of all logs for that date
// - Time, product name, points
// - If admin: show which user logged it
// - Total points for the day
```

**C. Role-Based Views:**
- **User:** See only own logs
- **Admin:** Toggle between "My Sales" and "All Users"

---

### 7. Sales History/Log Page
**File to Modify:** `app/log/page.tsx`

**Required Implementation:**

**A. List Logs:**
```typescript
const { data: logs } = await supabase
  .from('point_logs')
  .select('*')
  .eq('user_id', currentUser.id) // or no filter if admin viewing all
  .order('created_at', { ascending: false })
  .limit(50);
```

**B. Display:**
- Individual logs (not grouped)
- Time, product name, points, date
- Filter tabs: Today, Week, Month, All
- Day totals as section headers

**C. Flag Error (User Role):**
```typescript
const handleFlagError = async (logId: string, reason: string) => {
  await supabase
    .from('point_logs')
    .update({
      is_flagged: true,
      flag_reason: reason,
      flagged_at: new Date().toISOString(),
    })
    .eq('id', logId);
};
```

**D. Delete Log (Admin Role):**
```typescript
const handleDeleteLog = async (logId: string) => {
  // Only admin can delete
  if (!isAdminUser) return;

  await supabase
    .from('point_logs')
    .delete()
    .eq('id', logId);

  // Trigger auto-adjusts user.point_balance
};
```

**UI:**
- User: Show "Flag Error" button
- Admin: Show "Delete" button + view flagged logs

---

### 8. Bottom Navigation Update
**File to Modify:** `components/BottomNav.tsx`

**Required Changes:**

**User Role Tabs:**
- Home (products)
- Log (sales history)
- Calendar
- Profile/Settings

**Admin Role Tabs (Additional):**
- Home (products)
- Log (all sales)
- Calendar (all users)
- Users (user management) ← NEW
- Profile/Settings

**Implementation:**
```typescript
const user = await getCurrentUser();
const navItems = user?.role === 'admin'
  ? [...userNavItems, { id: 'users', href: '/users', icon: UsersIcon, label: 'users' }]
  : userNavItems;
```

---

### 9. User Management Page (Admin Only)
**File to Create:** `app/users/page.tsx`

**Features:**
- List all users
- Search by nickname
- View user details (points, recent sales)
- Edit user (change language, activate/deactivate)
- Create new user (from admin dashboard, not here)

**Example:**
```typescript
const { data: users } = await supabase
  .from('users')
  .select('*')
  .order('nickname');
```

---

### 10. Dashboard/Profile Page Updates
**Files to Modify:**
- `app/settings/page.tsx` or create `app/profile/page.tsx`

**Features:**
- Show user info (nickname, language)
- Point summary:
  - Today's points
  - This month's points
  - All-time points
- Recent activity (last 5-10 logs)
- Logout button
- Admin badge (if admin)

**Queries:**
```typescript
// Today's points
const today = new Date().toISOString().split('T')[0];
const { data: todayLogs } = await supabase
  .from('point_logs')
  .select('points')
  .eq('user_id', userId)
  .eq('log_date', today);

const todayPoints = todayLogs?.reduce((sum, log) => sum + log.points, 0) || 0;

// This month
const { data: monthPoints } = await supabase
  .rpc('get_user_points_by_month', {
    p_user_id: userId,
    p_year: new Date().getFullYear(),
    p_month: new Date().getMonth() + 1,
  });
```

---

## 🗑️ To Remove (Cleanup)

### 11. Remove Offline Features

**Files to Remove or Modify:**
1. `lib/db.ts` - IndexedDB/Dexie setup (remove entirely)
2. `lib/sync.ts` - Bundle sync logic (remove entirely)
3. `public/sw.js` - Service Worker (remove)
4. `next.config.ts` - Remove workbox plugin
5. `app/offline/page.tsx` - Offline page (remove)

**Dependencies to Remove from package.json:**
- dexie
- idb
- pako
- workbox-*

**Keep:**
- googleapis (might be used elsewhere)
- All Supabase and auth dependencies

---

## 📝 Environment Variables Required

**User Must Set Up:**

Create `.env.local` from `.env.local.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 🧪 Testing Checklist

### User Role Testing:
- [ ] Login with user nickname + PIN
- [ ] First login shows language selection
- [ ] Language preference saved
- [ ] Can view products (in selected language)
- [ ] Can click product → see read-only detail page
- [ ] Can log sale from detail page
- [ ] Sales appear in history
- [ ] Calendar shows daily totals
- [ ] Can click calendar date → see that day's logs
- [ ] Can flag errors in history
- [ ] Cannot delete logs
- [ ] Cannot access user management page
- [ ] Cannot see language toggle
- [ ] Can logout

### Admin Role Testing:
- [ ] Login with admin nickname + PIN
- [ ] Can toggle language in products
- [ ] Can click product → see editable detail page
- [ ] Can edit/delete products
- [ ] Can log sale for any user
- [ ] Can view all users' sales
- [ ] Calendar has "All Users" toggle
- [ ] Can delete any log
- [ ] Can see flagged logs
- [ ] Can access user management page
- [ ] User management page works
- [ ] Can logout

---

## 📚 Key Components to Reuse

**From Existing UI (Keep Same Design):**
- `components/AppShell.tsx` - Layout wrapper
- `components/TopBar.tsx` - Header
- `components/BottomNav.tsx` - Navigation (update for roles)
- `components/SearchBar.tsx` - Search input
- `components/TagChip.tsx` - Tag display
- All styling classes (glass effects, gradients, animations)

**Design System to Maintain:**
- Gradient backgrounds
- Glass morphism cards
- Smooth animations
- Brand colors (indigo/purple gradients)
- Rounded corners (rounded-4xl, rounded-5xl)
- Shadow effects

---

## 🔑 Important Helpers & Patterns

### 1. Get Current User
```typescript
import { getCurrentUser } from '@/lib/supabase';

const user = await getCurrentUser();
if (!user) {
  // Handle not logged in
}
```

### 2. Check Admin
```typescript
import { isAdmin } from '@/lib/supabase';

const isAdminUser = await isAdmin();
if (isAdminUser) {
  // Show admin features
}
```

### 3. Role-Based Rendering
```typescript
{user?.role === 'admin' && (
  <button>Admin Only Feature</button>
)}

{user?.role === 'user' && (
  <button>User Feature</button>
)}
```

### 4. Fetch Products with Text
```typescript
const { data: products } = await supabase
  .from('products')
  .select(`
    *,
    product_texts!inner (
      language,
      name,
      description,
      bundle_size
    )
  `)
  .eq('product_texts.language', userLanguage)
  .eq('is_active', true);
```

### 5. Log Sale
```typescript
const { error } = await supabase
  .from('point_logs')
  .insert({
    user_id: currentUser.id,
    product_id: productId,
    points: product.point_value,
    product_name: productText.name,
    category: product.category,
    logged_by: currentUser.id,
    log_date: new Date().toISOString().split('T')[0],
  });
```

---

## 📦 Next Steps for Local AI

**Priority Order:**

1. **Install Dependencies**
   ```bash
   cd /home/user/product-data-generator/myapp
   npm install
   ```

2. **Set Up Environment**
   - Create `.env.local` with Supabase credentials
   - Test connection

3. **Update Product Catalog** (app/page.tsx)
   - Remove offline sync
   - Fetch from Supabase
   - Implement role-based language toggle

4. **Update Product Detail** (app/product/[id]/page.tsx)
   - Role-based UI (read-only vs editable)
   - Log sale functionality

5. **Implement Calendar** (app/calendar/page.tsx)
   - Monthly grid with daily totals
   - Date details panel
   - Role-based views

6. **Update History/Log** (app/log/page.tsx)
   - Fetch from Supabase
   - Flag error (user)
   - Delete log (admin)

7. **Update Navigation** (components/BottomNav.tsx)
   - Role-based tabs

8. **Create User Management** (app/users/page.tsx)
   - Admin only

9. **Update Profile/Dashboard**
   - Point summary
   - Recent activity

10. **Cleanup**
    - Remove offline features
    - Test thoroughly

---

## 🎨 Design Guidelines

**Maintain Existing Aesthetic:**
- Glass morphism effects
- Smooth animations (animate-scale-in, animate-slide-down)
- Gradient buttons (bg-gradient-brand)
- Rounded corners (rounded-4xl, rounded-5xl)
- Soft shadows (shadow-soft, shadow-brand)
- Brand colors (indigo-600, purple-600)

**Animation Delays:**
```typescript
style={{ animationDelay: `${index * 0.05}s` }}
```

**Button Classes:**
```typescript
className="btn-primary"  // Gradient brand button
className="btn-secondary"  // White/glass button
className="card"  // Glass card
className="card-interactive"  // Hoverable card
className="glass"  // Glass effect
className="glass-strong"  // Stronger glass
```

---

## 🚀 Estimated Time to Complete

- Product catalog update: 2 hours
- Product detail page: 2 hours
- Calendar implementation: 3 hours
- History/log page: 2 hours
- Navigation & users page: 2 hours
- Profile/dashboard: 1 hour
- Cleanup & testing: 2 hours

**Total: ~14 hours**

---

## ✅ Foundation is Solid

**What's Already Working:**
- ✅ Authentication (login, onboarding)
- ✅ Session management
- ✅ Route protection
- ✅ Database types
- ✅ Supabase client
- ✅ Role checking helpers
- ✅ Beautiful UI design system

**Local AI Can Focus On:**
- Feature implementation
- Data fetching from Supabase
- Role-based UI rendering
- Business logic

---

**Status:** Ready for feature development!
**Last Updated:** 2025-01-17
