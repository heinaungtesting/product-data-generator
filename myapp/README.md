# MyApp - PDG Mobile Companion

A mobile-first, offline-capable PWA companion app for Product Data Generator (PDG). Optimized for iPhone 16e with full offline support using IndexedDB.

## Features

- **100% Offline** - Works completely offline after first sync using IndexedDB
- **Fast & Smooth** - Virtualized scrolling for 10,000+ products at 60fps
- **Multilingual** - Support for EN, JA, TH, KO, ZH with i18next
- **Privacy-First** - All data stored locally, no tracking
- **Auto-Sync** - ETag-based bundle syncing for efficient updates
- **PWA Installable** - Add to home screen, works like a native app
- **iPhone Optimized** - 44px touch targets, safe areas, haptic feedback
- **Dark Mode** - Auto, light, or dark theme support

## Architecture

- **Frontend**: Next.js 15 + React 19
- **Database**: IndexedDB via Dexie
- **State**: Zustand with localStorage persistence
- **i18n**: i18next with 5 languages
- **Virtualization**: react-virtuoso for performance
- **Offline**: Service Worker with Workbox patterns
- **Bundle**: Gzipped JSON from GitHub Pages

## Quick Start

### 1. Install Dependencies

```bash
cd myapp
npm install
```

### 2. Configure Environment

Create `myapp/.env.local`:

```env
# Bundle URL from GitHub Pages (after deployment)
NEXT_PUBLIC_BUNDLE_URL=https://yourusername.github.io/product-data-generator/bundle.json.gz

# Optional: Analytics, monitoring, etc.
# (None required - fully free!)
```

### 3. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3001

### 4. Build for Production

```bash
npm run build
npm start
```

## Deployment Options

### Option A: Vercel (Recommended)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy from myapp directory:
   ```bash
   cd myapp
   vercel
   ```

3. Follow prompts:
   - Project name: `myapp-pdg`
   - Framework: Next.js (auto-detected)
   - Build settings: Use defaults

4. Add environment variable in Vercel dashboard:
   - `NEXT_PUBLIC_BUNDLE_URL` = your GitHub Pages bundle URL

5. Deploy:
   ```bash
   vercel --prod
   ```

**Free tier**: 100GB bandwidth, unlimited requests

### Option B: Netlify

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Build the app:
   ```bash
   cd myapp
   npm run build
   ```

3. Deploy:
   ```bash
   netlify deploy --prod
   ```

4. Configure:
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Add environment variable in Netlify dashboard:
     - `NEXT_PUBLIC_BUNDLE_URL` = your GitHub Pages bundle URL

**Free tier**: 100GB bandwidth, 300 build minutes/month

### Option C: GitHub Pages (Static Export)

1. Update `myapp/next.config.ts`:
   ```typescript
   const nextConfig: NextConfig = {
     output: 'export',
     images: { unoptimized: true },
   };
   ```

2. Build and export:
   ```bash
   npm run build
   ```

3. Deploy to GitHub Pages:
   ```bash
   # Add to your repo's gh-pages branch
   git checkout -b gh-pages
   cp -r out/* .
   git add .
   git commit -m "Deploy MyApp to GitHub Pages"
   git push origin gh-pages
   ```

**Free tier**: Unlimited for public repos

## Bundle Setup (Required)

MyApp requires a product bundle hosted on GitHub Pages. This is automated via the MCP server and GitHub Actions.

### 1. Enable GitHub Pages

1. Go to your repo Settings → Pages
2. Source: Deploy from branch `gh-pages`
3. Folder: `/ (root)`
4. Save

### 2. Create Sample Data

Create `data/products.ndjson` in your main PDG repo:

```ndjson
{"id":"p001","category":"health","pointValue":100,"texts":[{"language":"en","name":"Sample Product","description":"A sample product"}],"tags":["sample"],"createdAt":"2025-01-01T00:00:00Z","updatedAt":"2025-01-01T00:00:00Z"}
```

### 3. Setup MCP Server

```bash
cd mcp-server
npm install
```

Create `mcp-server/.env`:

```env
GITHUB_TOKEN=ghp_your_token_here
GITHUB_OWNER=yourusername
GITHUB_REPO=product-data-generator
```

### 4. Test Bundle Generation

```bash
cd mcp-server
node index.js
```

The bundle will be published to:
`https://yourusername.github.io/product-data-generator/bundle.json.gz`

### 5. Automatic Updates

GitHub Actions will automatically rebuild the bundle when:
- You push changes to `data/` directory
- Nightly at 2 AM UTC (cron job)
- You manually trigger the workflow

No manual steps required!

## Usage Guide

### First Launch

1. Open MyApp in your browser or installed PWA
2. Go to Settings tab
3. Bundle URL is pre-configured from environment variable
4. Tap "Sync Now" to download products
5. Grant storage permission if prompted
6. Wait for sync to complete (shows ETag and product count)

### Daily Use

1. **Home Tab**: Browse all products with virtualized scrolling
   - Search by name or description
   - Filter by category
   - Pull to refresh (sync)

2. **Compare Tab**: Side-by-side product comparison
   - Add up to 4 products
   - Swipe to remove
   - Compare specs, effects, side effects

3. **Log Tab**: Track product usage
   - Add daily logs
   - View usage history
   - Export to CSV

4. **Calendar Tab**: Calendar view of activities
   - See logged products by date
   - Tap date to see details

5. **Settings Tab**: Configuration and data management
   - Change theme (light/dark/auto)
   - Toggle auto-sync on app open
   - Export/import/clear data
   - View sync status with ETag

### Offline Mode

- All features work offline after first sync
- Service worker caches UI and assets
- IndexedDB stores all product data
- Sync only when you want to update

## Development

### Project Structure

```
myapp/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with PWA metadata
│   ├── page.tsx           # Home page (product list)
│   ├── providers.tsx      # Client providers (i18n, theme)
│   ├── settings/          # Settings page
│   └── globals.css        # Global styles with themes
├── components/            # React components
│   ├── AppShell.tsx       # Layout wrapper
│   ├── BottomNav.tsx      # 5-tab navigation
│   ├── TopBar.tsx         # Header with search
│   ├── ListRow.tsx        # Virtualized list item
│   ├── SearchBar.tsx      # Debounced search input
│   ├── LanguageToggle.tsx # Flag-based language picker
│   └── TagChip.tsx        # Tag display component
├── lib/                   # Core logic
│   ├── db.ts              # Dexie database schema
│   ├── sync.ts            # Bundle fetching & ETag sync
│   ├── store.ts           # Zustand state management
│   └── i18n.ts            # i18next configuration
├── public/                # Static assets
│   ├── manifest.json      # PWA manifest
│   ├── sw.js              # Service worker
│   └── icons/             # App icons (72-512px)
├── package.json           # Dependencies
├── next.config.ts         # Next.js configuration
└── tsconfig.json          # TypeScript configuration
```

### Key Technologies

- **Next.js 15**: App Router, Server Components, Static Export
- **React 19**: Hooks, Suspense, Concurrent Features
- **Dexie 4**: IndexedDB wrapper with TypeScript support
- **Zustand 5**: Lightweight state management
- **i18next 24**: Internationalization framework
- **react-virtuoso 4**: Virtualized scrolling
- **Workbox**: Service Worker toolkit
- **Pako**: Gzip compression/decompression

### Adding a New Language

1. Add language to `lib/i18n.ts`:
   ```typescript
   const resources = {
     // ... existing languages
     es: {
       translation: {
         home: 'Inicio',
         // ... all translations
       }
     }
   };
   ```

2. Add flag to `LanguageToggle.tsx`:
   ```typescript
   const languages = [
     // ... existing
     { code: 'es', flag: '🇪🇸', name: 'Español' },
   ];
   ```

### Database Schema

```typescript
// products: Main product catalog
{
  id: string,              // Primary key
  category: string,        // 'health' | 'cosmetic'
  tags: string[],          // Multi-entry index
  pointValue: number,
  texts: ProductText[],
  updatedAt: Date,
  syncedAt: Date          // When synced from bundle
}

// drafts: User-created drafts
{
  id: string,             // Primary key
  productId?: string,     // Link to product (if editing)
  data: any,              // Draft data
  updatedAt: Date
}

// logs: Usage tracking
{
  id: number,             // Auto-increment
  productId: string,      // Link to product
  action: string,         // 'used' | 'purchased'
  timestamp: Date,
  notes?: string
}

// meta: App metadata (sync info, version)
{
  key: string,            // Primary key ('sync', 'version')
  value: any,             // JSON value
  updatedAt: Date
}
```

## Performance Optimization

### Virtualized Scrolling

Uses react-virtuoso to render only visible items:
- Renders ~20 items at a time
- Handles 10,000+ products smoothly
- Maintains 60fps scrolling

### Bundle Compression

- NDJSON → JSON: ~30% larger
- Gzip compression: ~70% reduction
- 10,000 products: ~500KB gzipped
- Downloads in <2 seconds on 4G

### Offline Performance

- Service Worker: Cache-first for UI (instant load)
- IndexedDB: <10ms queries for product list
- Virtual scroll: No layout thrashing
- Total first paint: <100ms (after cache)

## Troubleshooting

### "No products found" after sync

1. Check bundle URL in Settings
2. Verify GitHub Pages is enabled
3. Ensure bundle.json.gz exists in gh-pages branch
4. Check browser console for fetch errors

### Service Worker not registering

1. Must use HTTPS or localhost
2. Check browser console for errors
3. Verify `public/sw.js` exists
4. Clear site data and reload

### Sync fails with CORS error

1. GitHub Pages must be public
2. Bundle must be in gh-pages branch
3. Verify bundle URL is correct
4. Check GitHub Pages deployment status

### PWA not installable

1. Must use HTTPS (Vercel/Netlify auto-HTTPS)
2. manifest.json must be valid
3. Service worker must register successfully
4. Check Lighthouse PWA score (should be ≥90)

### Database quota exceeded

1. Default limit: ~50MB (mobile), ~100MB (desktop)
2. Export data via Settings → Export
3. Clear old data via Settings → Clear Data
4. Reduce product count in bundle

## Testing Checklist

Before deploying to production:

- [ ] Install dependencies and build succeeds
- [ ] Development server runs on localhost:3001
- [ ] All 5 tabs navigate correctly
- [ ] Sync downloads products from bundle
- [ ] Search filters products correctly
- [ ] Virtualized list scrolls smoothly at 60fps
- [ ] Service worker registers successfully
- [ ] Offline mode works (disable network)
- [ ] PWA installable (Lighthouse score ≥90)
- [ ] Dark mode toggle works
- [ ] Language toggle shows all 5 languages
- [ ] Export/import data works
- [ ] Tested on iPhone 16e or simulator
- [ ] Touch targets ≥44px (accessibility)
- [ ] Safe areas respected (no notch overlap)

## License

Same as parent PDG project.

## Support

For issues or questions, please open an issue in the main PDG repository.
