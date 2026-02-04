# Product Image Upload and Multilingual Warnings - Implementation Summary

## Overview
This implementation adds two major features to the Product Data Generator (PDG) and MyApp:
1. **Product Image Upload**: Upload and display product images
2. **Multilingual Warnings**: Add safety information in multiple languages

## Changes Made

### 1. Schema Updates (`packages/schema/src/index.ts`)

#### Added Image Field
- Type: `z.string().optional()`
- Allows products to have an optional image path
- Stored as a relative path like `/images/products/[product-id].jpg`

#### Added Warnings Field
- Type: Localized text object (similar to description, effects, etc.)
- Supports all 5 languages: EN, ZH, KO, TH, JA
- Each language can have up to 600 characters
- Defaults to empty strings for all languages
- Schema: `localizedWarningsSchema`

Example:
```typescript
warnings: {
  en: "Do not take if pregnant",
  ja: "妊娠中の方は使用しないでください",
  zh: "怀孕期间请勿使用",
  ko: "임산부는 복용하지 마세요",
  th: "ห้ามใช้ในหญิงตั้งครรภ์"
}
```

### 2. Database Schema (`prisma/schema.prisma`)

#### Product Model
- Added `image String?` field (nullable)

#### ProductText Model
- Added `warnings String @default("")` field

#### Migration
- Migration file: `prisma/migrations/20260204043858_add_image_and_warnings/migration.sql`
- Adds both fields to the database
- Safe migration - adds nullable/default fields

### 3. Image Upload API (`app/api/upload/route.ts`)

**New API endpoint**: `POST /api/upload`

Features:
- Accepts multipart/form-data with `file` and `productId`
- Validates file types: JPG, PNG, WebP only
- Validates file size: Max 5MB
- Saves to `public/images/products/[productId].[ext]`
- Returns JSON with image path

Example response:
```json
{
  "success": true,
  "path": "/images/products/abc-123.jpg",
  "message": "Image uploaded successfully"
}
```

### 4. ProductForm Component (`components/ProductForm.tsx`)

#### Image Upload Section
- Drag & drop zone with click-to-upload
- Shows upload progress
- Image preview after upload
- Remove button to delete image
- Visual feedback for upload status

UI Features:
- 📷 Upload icon
- File type hints (JPG, PNG, WebP)
- Size limit display (max 5MB)
- Error messages for invalid uploads

#### Warnings Section
- Multilingual text inputs (5 languages)
- Flag icons for each language (🇺🇸 🇨🇳 🇰🇷 🇹🇭 🇯🇵)
- Placeholder text: "e.g., Do not take if pregnant..."
- ⚠️ Warning icon in section header
- Validation error display

### 5. Product Service Updates (`lib/product-service.ts`)

#### Updated Functions

**`LOCALIZABLE_FIELDS`**
- Added "warnings" to the list of localizable fields
- Ensures warnings are processed like other localized content

**`mapProductRecord()`**
- Maps database `warnings` field to product warnings object
- Handles default empty string for missing warnings

**`upsertTexts()`**
- Saves warnings to ProductText table
- Creates/updates warnings for all languages

**`saveProduct()`**
- Saves image path to Product table
- Handles nullable image field

**Bundle Generation**
- Includes `image` field in product bundles
- Includes `warnings` localized text in bundles

### 6. MyApp Updates

#### Database Schema (`myapp/lib/db.ts`)
```typescript
export interface Product {
  // ... existing fields
  image?: string;
  warnings?: Record<string, string>;
}
```

#### Product List Page (`myapp/app/page.tsx`)

**Product Cards**:
- Shows product image if available
- Falls back to colored initials if no image
- Image uses `object-cover` for proper aspect ratio
- Maintains gradient overlay on hover

Before:
```jsx
<div>
  <span>{initials}</span>
</div>
```

After:
```jsx
{product.image ? (
  <img src={product.image} alt={displayName} />
) : (
  <div>
    <span>{initials}</span>
  </div>
)}
```

#### Product Detail Page (`myapp/app/product/[id]/page.tsx`)

**Image Display**:
- Full-size product image in hero section
- Rounded corners with proper sizing
- Falls back to circular initial badge if no image
- Removes decorative gradient when image present

**Warnings Section**:
- Only shows if warnings exist
- Amber/yellow background for visibility
- ⚠️ Warning icon in header
- Multilingual header: "Warning / 注意 / 주의 / คำเตือน"
- Shows warning in selected language
- Falls back to other languages if current language empty

Features:
- Distinct styling from other sections
- Higher contrast text (amber-900)
- Bold font for emphasis
- Border for attention

## File Structure

```
product-data-generator/
├── app/api/upload/
│   └── route.ts                      # NEW: Image upload API
├── components/
│   └── ProductForm.tsx               # UPDATED: Image upload + warnings UI
├── lib/
│   └── product-service.ts            # UPDATED: Handle new fields
├── myapp/
│   ├── app/
│   │   ├── page.tsx                  # UPDATED: Show images in cards
│   │   └── product/[id]/page.tsx    # UPDATED: Show image + warnings
│   └── lib/
│       └── db.ts                     # UPDATED: Add new fields to interface
├── packages/schema/src/
│   └── index.ts                      # UPDATED: Add image + warnings schemas
├── prisma/
│   ├── schema.prisma                 # UPDATED: Add database fields
│   └── migrations/
│       └── 20260204043858_add_image_and_warnings/
│           └── migration.sql         # NEW: Database migration
└── public/images/products/           # NEW: Image storage directory
```

## Usage Examples

### 1. Adding a Product with Image and Warnings (PDG)

1. Navigate to PDG product form
2. Fill in product details
3. Click "📷 Click to upload" in the Product Image section
4. Select an image file (JPG, PNG, or WebP, max 5MB)
5. Image uploads and preview appears
6. Fill in warnings for each language in the ⚠️ Warnings section
7. Submit the form

### 2. Viewing Products with Images (MyApp)

1. Open MyApp home page
2. Product cards now show uploaded images instead of initials
3. Click on a product to see details
4. View full-size image in product detail page
5. See warnings section (if product has warnings)

### 3. API Usage

Upload image:
```javascript
const formData = new FormData();
formData.append('file', imageFile);
formData.append('productId', 'abc-123');

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData
});

const { path } = await response.json();
// path = "/images/products/abc-123.jpg"
```

## Technical Details

### Image Storage
- Location: `public/images/products/`
- Naming: `[product-id].[extension]`
- Formats: JPG, PNG, WebP
- Size limit: 5MB
- Served statically by Next.js

### Warnings Validation
- Per-language character limit: 600 characters
- Optional field (can be empty)
- Stored separately for each language
- Defaults to empty string if not provided

### Database Schema
```sql
-- Product table
ALTER TABLE Product ADD COLUMN image TEXT;

-- ProductText table
ALTER TABLE ProductText ADD COLUMN warnings TEXT DEFAULT '';
```

### Bundle Format
Products in bundles now include:
```json
{
  "id": "abc-123",
  "image": "/images/products/abc-123.jpg",
  "warnings": {
    "en": "Do not take if pregnant",
    "ja": "妊娠中の方は使用しないでください",
    "zh": "怀孕期间请勿使用",
    "ko": "임산부는 복용하지 마세요",
    "th": "ห้ามใช้ในหญิงตั้งครรภ์"
  }
}
```

## Testing

### Schema Validation
✅ Tested with TypeScript compilation
✅ Validated product schema with new fields
✅ Verified warnings accepts empty strings
✅ Verified image field is optional

### Manual Testing Checklist
- [ ] Upload image in PDG product form
- [ ] View uploaded image preview
- [ ] Remove uploaded image
- [ ] Add warnings in multiple languages
- [ ] Create product with both image and warnings
- [ ] View product in MyApp with image
- [ ] View warnings on product detail page
- [ ] Test image fallback (no image → shows initials)
- [ ] Test warnings fallback (no warnings → section hidden)
- [ ] Generate bundle with new fields
- [ ] Sync MyApp with updated bundle

## Security Considerations

### Image Upload
- ✅ File type validation (whitelist)
- ✅ File size limit (5MB)
- ✅ Stored in public directory (no executable)
- ✅ Filename sanitization (uses product ID)
- ⚠️ No image content validation (could add later)

### Warnings Field
- ✅ Character limit prevents abuse
- ✅ Stored as plain text (no XSS risk in DB)
- ✅ Displayed with `whitespace-pre-line` (preserves formatting)

## Future Enhancements

Potential improvements:
1. Image optimization (resize, compress)
2. Multiple images per product
3. Image CDN integration
4. Image content validation (dimensions, format verification)
5. Warnings rich text editor
6. Warnings severity levels
7. Image crop/edit functionality
8. Drag-and-drop image reordering

## Migration Notes

For existing installations:
1. Run database migration: `npm run db:migrate`
2. All existing products will have:
   - `image`: null
   - `warnings`: "" (empty string) for all languages
3. No data loss occurs
4. Backwards compatible with existing bundles

## Dependencies

No new dependencies added. Uses existing:
- Next.js built-in File API
- Node.js fs/promises
- Prisma ORM
- Zod validation

## Conclusion

This implementation successfully adds product image upload and multilingual warnings features to both PDG and MyApp. The changes are:
- ✅ Type-safe with TypeScript
- ✅ Database-backed with Prisma
- ✅ Validated with Zod schemas
- ✅ Backwards compatible
- ✅ User-friendly UI
- ✅ Well-structured code
