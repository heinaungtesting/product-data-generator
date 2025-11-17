# Admin Dashboard Architecture Requirements

**Date:** 2025-01-17
**Project:** Replace PDG interface with Admin Dashboard + MyApp Frontend

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                  SUPABASE DATABASE                      │
│  ┌──────────┐ ┌────────────┐ ┌───────┐ ┌──────────┐   │
│  │ products │ │ point_logs │ │ users │ │  images  │   │
│  │  +images │ │  +sales    │ │ roles │ │          │   │
│  └──────────┘ └────────────┘ └───────┘ └──────────┘   │
└─────────────────────────────────────────────────────────┘
         ↑                                    ↑
         │                                    │
    ┌────┴────────┐                    ┌─────┴──────┐
    │             │                    │            │
┌──────────────┐  │              ┌─────────────┐   │
│ Admin        │  │              │ Regular     │   │
│ Dashboard    │──┘              │ Users       │───┘
│ (New)        │                 │ (MyApp PWA) │
└──────────────┘                 └─────────────┘
• CRUD products                  • View products
• CRUD users                     • Product details
• Manage points                  • Log sales(?)
• Upload images                  • View own points
• View sales logs                • Multi-language
• Full admin panel               • Role-based access
• English only UI                • (Admin sees all)
```

---

## Project Structure

### Project 1: Admin Dashboard (NEW - Replaces PDG)

**Location:** `product-data-generator/` (replace existing interface)

**Purpose:** Backend management system for admin only

**Tech Stack:**
- Next.js 15 (App Router)
- Supabase (PostgreSQL + Storage)
- TypeScript
- Tailwind CSS
- Shadcn/ui (modern admin UI components)

**Features:**

1. **Authentication**
   - Admin login (email + password) via Supabase Auth
   - Role-based access (admin role required)
   - Secure session management

2. **Product Management (CRUD)**
   - Create/Read/Update/Delete products
   - Upload product images (Supabase Storage)
   - Set point values
   - Manage categories (health/cosmetic)
   - Multi-language product text entry (JA, EN, ZH, TH, KO)
   - Tag management
   - Active/Inactive toggle

3. **User Management (CRUD)**
   - Create users with nickname + PIN
   - Assign user roles (admin/user)
   - View user point balances
   - Activate/Deactivate users
   - Reset PINs
   - View user sales history

4. **Point Management**
   - View all point transactions
   - Manual point adjustments
   - Point log filtering (by user, date, product)
   - Export point reports (CSV/Excel)

5. **Sales Tracking**
   - View all sales logs
   - Real-time sales dashboard
   - Sales analytics (daily/weekly/monthly)
   - Filter by user, product, date range
   - Sales reports

6. **Image Upload**
   - Product image upload (Supabase Storage)
   - Image cropping/resizing
   - Multiple images per product
   - Image gallery management

7. **Additional Features**
   - Dashboard with key metrics
   - Search and filtering
   - Data export functionality
   - Audit logs (who changed what)
   - Bulk operations

**UI Language:** English only

**Interface:** Desktop-optimized admin panel (not mobile-first)

---

### Project 2: MyApp (Existing PWA - Frontend)

**Location:** `myapp/` (existing mobile PWA)

**Purpose:** User-facing application with role-based access

**Tech Stack:**
- Existing tech stack (maintain current setup)
- Supabase integration (read products, log sales)

**User Features (Regular Users):**
- View product catalog (multi-language)
- View product details page
- View own point balance
- View own sales history
- *Possibly:* Log own sales (click product → log sale)

**Admin Features (When Admin Logs In):**
- All user features +
- CRUD products (full management)
- View all users' data
- Manage points
- Access admin functions

**Role-Based Access:**
```typescript
if (user.role === 'admin') {
  // Show admin controls
  // Enable editing
  // Access all data
} else {
  // View-only for products
  // Own data only
  // Limited features
}
```

**UI Language:** Multi-language toggle (JA, EN, ZH, TH, KO) for product details

---

## Database Schema (Supabase)

### Tables:

```sql
-- Users (replaces "staff" table)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname TEXT UNIQUE NOT NULL,           -- Display name
  pin_hash TEXT NOT NULL,                  -- Hashed PIN
  email TEXT UNIQUE,                       -- Optional for admin
  role TEXT NOT NULL DEFAULT 'user',       -- 'admin' | 'user'
  point_balance INTEGER NOT NULL DEFAULT 0, -- Auto-calculated
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products (enhanced with images)
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  category TEXT CHECK (category IN ('health', 'cosmetic')),
  point_value INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,                          -- Main image
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Texts (multi-language)
CREATE TABLE product_texts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  language TEXT CHECK (language IN ('ja', 'en', 'zh', 'th', 'ko')),
  name TEXT NOT NULL,
  description TEXT,
  bundle_size TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, language)
);

-- Point Logs (enhanced for sales tracking)
CREATE TABLE point_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
  points INTEGER NOT NULL,
  product_name TEXT NOT NULL,              -- Snapshot
  category TEXT CHECK (category IN ('health', 'cosmetic')),
  notes TEXT,
  logged_by UUID REFERENCES users(id),     -- Who logged it (admin or self)
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Images (multiple images per product)
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,                 -- Supabase Storage URL
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tags (existing)
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ja TEXT,
  name_en TEXT,
  name_zh TEXT,
  name_th TEXT,
  name_ko TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Tags (many-to-many)
CREATE TABLE product_tags (
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, tag_id)
);

-- Audit Logs (track admin actions)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,                    -- 'create', 'update', 'delete'
  table_name TEXT NOT NULL,
  record_id TEXT,
  changes JSONB,                           -- What changed
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Triggers:

```sql
-- Auto-update user point_balance when point_logs change
CREATE OR REPLACE FUNCTION update_user_point_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE users
    SET point_balance = point_balance + NEW.points,
        updated_at = NOW()
    WHERE id = NEW.user_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE users
    SET point_balance = point_balance - OLD.points,
        updated_at = NOW()
    WHERE id = OLD.user_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_point_balance
AFTER INSERT OR DELETE ON point_logs
FOR EACH ROW
EXECUTE FUNCTION update_user_point_balance();

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Row Level Security (RLS):

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_logs ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  USING (auth.uid() = id OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Admins can do everything
CREATE POLICY "Admins can do everything"
  ON users FOR ALL
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Products are readable by all authenticated users
CREATE POLICY "Products readable by authenticated"
  ON products FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only admins can modify products
CREATE POLICY "Only admins can modify products"
  ON products FOR ALL
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Users can read own point logs, admins can read all
CREATE POLICY "Users can read own logs"
  ON point_logs FOR SELECT
  USING (user_id = auth.uid() OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');
```

---

## Admin Dashboard Pages/Routes

```
admin-dashboard/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx              ← Admin login
│   │   └── layout.tsx                ← Auth layout
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx                ← Dashboard layout (sidebar, header)
│   │   ├── page.tsx                  ← Dashboard home (metrics)
│   │   │
│   │   ├── products/
│   │   │   ├── page.tsx              ← Product list
│   │   │   ├── new/
│   │   │   │   └── page.tsx          ← Create product
│   │   │   └── [id]/
│   │   │       ├── page.tsx          ← View product
│   │   │       └── edit/
│   │   │           └── page.tsx      ← Edit product
│   │   │
│   │   ├── users/
│   │   │   ├── page.tsx              ← User list
│   │   │   ├── new/
│   │   │   │   └── page.tsx          ← Create user
│   │   │   └── [id]/
│   │   │       ├── page.tsx          ← View user (points, history)
│   │   │       └── edit/
│   │   │           └── page.tsx      ← Edit user
│   │   │
│   │   ├── points/
│   │   │   ├── page.tsx              ← Point logs list
│   │   │   └── adjust/
│   │   │       └── page.tsx          ← Manual point adjustment
│   │   │
│   │   ├── sales/
│   │   │   ├── page.tsx              ← Sales log/analytics
│   │   │   └── reports/
│   │   │       └── page.tsx          ← Generate reports
│   │   │
│   │   └── settings/
│   │       └── page.tsx              ← Admin settings
│   │
│   └── api/
│       ├── products/
│       │   ├── route.ts              ← List/Create products
│       │   └── [id]/
│       │       └── route.ts          ← Get/Update/Delete product
│       ├── users/
│       │   ├── route.ts              ← List/Create users
│       │   └── [id]/
│       │       └── route.ts          ← Get/Update/Delete user
│       ├── points/
│       │   └── route.ts              ← Point operations
│       ├── sales/
│       │   └── route.ts              ← Sales data
│       └── upload/
│           └── route.ts              ← Image upload
│
├── components/
│   ├── ui/                           ← Shadcn/ui components
│   ├── products/
│   │   ├── ProductTable.tsx
│   │   ├── ProductForm.tsx
│   │   └── ImageUpload.tsx
│   ├── users/
│   │   ├── UserTable.tsx
│   │   └── UserForm.tsx
│   ├── points/
│   │   ├── PointLogTable.tsx
│   │   └── PointAdjustmentForm.tsx
│   └── layout/
│       ├── Sidebar.tsx
│       ├── Header.tsx
│       └── DashboardLayout.tsx
│
├── lib/
│   ├── supabase.ts                   ← Supabase client
│   └── utils.ts                      ← Helpers
│
└── types/
    └── supabase.ts                   ← Database types
```

---

## Key Features Detailed

### 1. Product Management

**Create Product:**
```typescript
interface ProductForm {
  id: string;                         // Product ID
  category: 'health' | 'cosmetic';
  pointValue: number;
  images: File[];                     // Upload multiple images
  texts: {
    ja: { name: string; description: string; bundleSize: string };
    en: { name: string; description: string; bundleSize: string };
    zh: { name: string; description: string; bundleSize: string };
    th: { name: string; description: string; bundleSize: string };
    ko: { name: string; description: string; bundleSize: string };
  };
  tags: string[];                     // Tag IDs
}
```

**Features:**
- Drag-and-drop image upload
- Multi-language text editor (tabs for each language)
- Point value calculator
- Tag selection (multi-select)
- Preview (optional - you said no need)
- Bulk import/export (CSV)

### 2. User Management

**Create User:**
```typescript
interface UserForm {
  nickname: string;
  pin: string;                        // 4-digit PIN
  role: 'admin' | 'user';
  email?: string;                     // Optional, for admin
}
```

**Features:**
- Generate random nickname (optional)
- Auto-generate PIN (optional)
- Role assignment
- Bulk user creation (CSV import)
- User activity log
- Point balance display

### 3. Point Management

**Features:**
- View all point transactions
- Filter by user, date range, product
- Manual point adjustment (add/subtract points with reason)
- Point history export
- Point analytics dashboard

### 4. Sales Tracking

**Features:**
- Real-time sales feed
- Sales by product (which products sell most)
- Sales by user (leaderboard)
- Daily/weekly/monthly reports
- Revenue calculator (if points = money)
- Export sales data (CSV/Excel)

### 5. Image Upload

**Implementation:**
```typescript
// Upload to Supabase Storage
const uploadImage = async (file: File, productId: string) => {
  const fileName = `${productId}/${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(fileName, file);

  return data?.path;
};

// Get public URL
const { data } = supabase.storage
  .from('product-images')
  .getPublicUrl(imagePath);
```

**Features:**
- Image compression before upload
- Multiple images per product
- Image reordering (drag-and-drop)
- Delete images
- Image CDN via Supabase

---

## MyApp Frontend Integration

### Role-Based UI

```typescript
// MyApp - Check user role
const { data: user } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single();

if (user.role === 'admin') {
  // Show admin features
  return <AdminProductView />;
} else {
  // Show user features
  return <UserProductView />;
}
```

### User Features (MyApp)

**Product Catalog:**
- Grid/List view
- Multi-language toggle (JA, EN, ZH, TH, KO)
- Category filter
- Search
- Click product → View details

**Product Detail Page:**
- Product images (gallery)
- Multi-language description
- Point value display
- *Possibly:* "Log Sale" button (for users to log their own sales)

**User Dashboard:**
- Current point balance
- Recent sales history
- Monthly point summary
- Leaderboard (if gamification wanted)

### Admin Features (MyApp when admin logged in)

**Everything above +**
- Edit product button on detail page
- Create new product (FAB button)
- Delete product
- View all users' sales
- Manage users

---

## Authentication Flow

### Admin Dashboard:

```typescript
// Login with email + password (Supabase Auth)
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'admin@example.com',
  password: 'password',
});

// Check role
const { data: user } = await supabase
  .from('users')
  .select('role')
  .eq('id', data.user.id)
  .single();

if (user.role !== 'admin') {
  throw new Error('Unauthorized');
}
```

### MyApp (User):

```typescript
// Login with nickname + PIN
const { data: user } = await supabase
  .from('users')
  .select('*')
  .eq('nickname', nickname)
  .eq('is_active', true)
  .single();

if (user && await bcrypt.compare(pin, user.pin_hash)) {
  // Create session
  // Store user data
}
```

---

## Implementation Timeline

| Phase | Task | Time | Details |
|-------|------|------|---------|
| **Phase 1** | Supabase Setup | 30 min | Create project, set up storage, run migrations |
| **Phase 2** | Admin Auth | 1 hr | Login page, role checking, middleware |
| **Phase 3** | Dashboard Layout | 2 hrs | Sidebar, header, navigation, responsive |
| **Phase 4** | Product CRUD | 4 hrs | List, create, edit, delete products |
| **Phase 5** | Image Upload | 2 hrs | Supabase Storage integration, upload UI |
| **Phase 6** | Multi-language Editor | 2 hrs | Tabs for each language, form handling |
| **Phase 7** | User CRUD | 3 hrs | List, create, edit, delete users |
| **Phase 8** | Point Management | 2 hrs | Point logs, manual adjustments |
| **Phase 9** | Sales Tracking | 2 hrs | Sales log, analytics, reports |
| **Phase 10** | MyApp Integration | 3 hrs | Role-based views, user features |
| **Phase 11** | Testing | 2 hrs | E2E testing, bug fixes |
| **Phase 12** | Deployment | 1 hr | Deploy to Vercel |
| **Total** | | **24-26 hrs** | Full implementation |

---

## UI/UX Design (Admin Dashboard)

### Design System:
- **Component Library:** Shadcn/ui (modern, accessible)
- **Color Scheme:** Professional admin theme (dark mode optional)
- **Layout:** Sidebar navigation + top header
- **Tables:** Sortable, filterable, paginated
- **Forms:** Inline validation, auto-save drafts
- **Modals:** For confirmations, quick edits

### Example Dashboard Layout:

```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] Admin Dashboard                    [User] [Logout]   │
├──────────┬──────────────────────────────────────────────────┤
│          │                                                   │
│ Dashboard│  Dashboard Overview                              │
│ Products │  ┌────────────┬────────────┬────────────┐       │
│ Users    │  │ 127        │ 45         │ 1,234      │       │
│ Points   │  │ Products   │ Users      │ Total Pts  │       │
│ Sales    │  └────────────┴────────────┴────────────┘       │
│ Settings │                                                   │
│          │  Recent Sales                                    │
│          │  ┌───────────────────────────────────────────┐  │
│          │  │ User    Product      Points   Time        │  │
│          │  │ Sunny   Vitamin C    +10      2 mins ago  │  │
│          │  │ Mike    Collagen     +15      5 mins ago  │  │
│          │  └───────────────────────────────────────────┘  │
│          │                                                   │
└──────────┴───────────────────────────────────────────────────┘
```

---

## Questions to Clarify

### 1. User Sales Logging (MyApp):
**Should regular users be able to log their own sales in MyApp?**

**Option A:** Users self-log sales
- User clicks product → Confirms → Points added
- Fast, real-time
- Requires trust

**Option B:** Admin logs sales for users
- Admin dashboard has "Log Sale" feature
- Admin selects user + product → Points added
- More control, slower

**Option C:** Hybrid
- Users can self-log
- Admin can also log for users
- Audit log tracks who logged what

**Recommendation:** Option C

### 2. Point System:
**What do points represent?**
- Sales commission?
- Performance tracking?
- Gamification/rewards?

**Why it matters:**
- Affects reporting features
- May need point conversion (points → money)
- May need reward tiers

### 3. Image Requirements:
**For product images:**
- How many images per product? (1 main + gallery?)
- Image size limits? (e.g., max 5MB)
- Required dimensions? (e.g., 800x800px)
- Support for image cropping?

### 4. Access Control:
**For MyApp when admin uses it:**
- Should admin account be separate from regular user account?
- Can one account have multiple roles?
- Should there be "super admin" vs "admin" roles?

### 5. Data Migration:
**From existing PDG project:**
- Migrate existing products? (yes/no)
- Migrate existing data? (tags, etc.)
- Keep MCP server integration? (Claude Desktop)

---

## Technology Stack Details

### Admin Dashboard:
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "@supabase/auth-helpers-nextjs": "^0.8.7",
    "next": "^15.0.0",
    "react": "^19.0.0",
    "typescript": "^5.3.0",
    "tailwindcss": "^3.4.0",
    "@radix-ui/react-*": "latest",
    "class-variance-authority": "^0.7.0",
    "lucide-react": "^0.300.0",
    "react-hook-form": "^7.49.0",
    "zod": "^3.22.0",
    "bcryptjs": "^2.4.3",
    "date-fns": "^3.0.0",
    "recharts": "^2.10.0",
    "react-dropzone": "^14.2.0"
  }
}
```

### MyApp:
```json
{
  "existing": "Keep current dependencies",
  "add": {
    "@supabase/supabase-js": "^2.39.0",
    "Additional dependencies as needed"
  }
}
```

---

## Security Considerations

1. **Authentication:**
   - Admin: Email + password (Supabase Auth)
   - Users: Nickname + PIN (4-6 digits, hashed)
   - Session timeout: 8 hours

2. **Authorization:**
   - Row Level Security (RLS) on all tables
   - Role-based access checks
   - API route protection (middleware)

3. **Data Protection:**
   - PIN hashing with bcrypt
   - Audit logs for admin actions
   - No sensitive data in logs

4. **File Upload Security:**
   - File type validation
   - File size limits
   - Virus scanning (optional)
   - Signed URLs for private images

---

## Success Criteria

✅ Admin can create/edit/delete products with images
✅ Admin can create/edit/delete users (nickname + PIN)
✅ Admin can view all point logs and sales
✅ Admin can manually adjust points
✅ Users can login to MyApp with nickname + PIN
✅ Users can view product catalog (multi-language)
✅ Users can view product details
✅ Users can view their own points and history
✅ Admin sees additional features in MyApp
✅ Real-time data sync across admin dashboard and MyApp
✅ Image upload works smoothly
✅ Responsive design for admin dashboard
✅ All CRUD operations work correctly
✅ Role-based access enforced

---

## Deployment Plan

### Admin Dashboard:
- **Platform:** Vercel
- **Domain:** admin.yourproject.com (or subdomain)
- **Environment:** Production + Staging

### MyApp:
- **Platform:** Existing deployment (keep as is)
- **Update:** Add Supabase integration

### Supabase:
- **Plan:** Pro (for production)
- **Backup:** Daily automated backups
- **Monitoring:** Enable database metrics

---

## Cost Estimate

### Development:
- **Time:** 24-26 hours
- **Hourly Rate:** (Your rate)
- **Total:** (Calculate based on your rate)

### Hosting (Monthly):
- **Vercel:** Free (Hobby) or $20/month (Pro)
- **Supabase:** $25/month (Pro plan)
- **Domain:** ~$12/year
- **Total:** ~$25-45/month

---

## Next Steps

1. **Confirm Requirements:**
   - Answer clarification questions above
   - Approve database schema
   - Approve UI design direction

2. **Set Up Supabase:**
   - Create account
   - Create project
   - Set up storage bucket
   - Get API keys

3. **Start Development:**
   - Phase 1: Database setup
   - Phase 2: Admin dashboard foundation
   - Phase 3: Feature implementation
   - Phase 4: MyApp integration
   - Phase 5: Testing & deployment

---

**Status:** Waiting for confirmation on:
1. User sales logging approach (Option A/B/C)
2. Point system purpose
3. Image requirements
4. Access control model
5. Data migration needs

**Once confirmed, ready to start implementation.**
