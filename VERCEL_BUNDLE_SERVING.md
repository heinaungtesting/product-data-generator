# Serving Bundle from Vercel (Alternative to GitHub Pages)

## Why This Approach?

GitHub Pages was returning 403 errors, so we're serving the bundle directly from your Vercel deployment instead.

## How It Works

### 1. Bundle Storage
The bundle is stored in `myapp/public/bundle.json.gz` and deployed with your app.

### 2. API Route
Created `/api/bundle` route that serves the bundle with proper headers:
- ✅ CORS enabled (Access-Control-Allow-Origin: *)
- ✅ Proper Content-Type (application/gzip)
- ✅ Caching (5 min browser, 10 min CDN)

### 3. Default URL
MyApp now defaults to `/api/bundle` (relative URL) which resolves to your Vercel deployment.

## Deployment Steps

### Step 1: Push Changes

```bash
git checkout claude/optimize-local-privacy-app-011CUgaqpdEMSoo1wvoAJE2g
git pull
```

### Step 2: Deploy to Vercel

From your local machine:

```bash
cd myapp
vercel --prod
```

Or just push to GitHub and Vercel will auto-deploy.

### Step 3: Test Bundle Access

Your bundle will be at:
```
https://your-myapp.vercel.app/api/bundle
```

Test it:
```bash
curl -s https://myproductcatalog.vercel.app/api/bundle | gunzip | jq '.productCount'
# Should return: 5
```

### Step 4: Test Sync

1. Open MyApp: `https://myproductcatalog.vercel.app`
2. **Clear cache**: F12 → Application → Clear Storage
3. **Refresh** page
4. Go to **Settings** → **Sync Now**
5. Should work! ✅

## No Environment Variable Needed!

Since we're using a relative URL (`/api/bundle`), it automatically works on any deployment:
- ✅ Production: `https://myproductcatalog.vercel.app/api/bundle`
- ✅ Preview: `https://myproductcatalog-xxx.vercel.app/api/bundle`
- ✅ Local dev: `http://localhost:3001/api/bundle`

**No need to configure `NEXT_PUBLIC_BUNDLE_URL`** - it just works!

## Updating the Bundle

When you add/update products in PDG:

### Option 1: Automatic (via MCP)

1. Use MCP to update products
2. MCP auto-commits to GitHub
3. Regenerate bundle:
   ```bash
   cd /path/to/product-data-generator
   DATABASE_URL="file:./prisma/dev.db" node mcp-server/build-bundle-direct.js
   ```
4. Copy to MyApp:
   ```bash
   cp dist/bundle.json.gz myapp/public/
   ```
5. Commit and push
6. Vercel auto-deploys with new bundle

### Option 2: Manual

1. Update products in database
2. Regenerate bundle (same as above)
3. Copy to MyApp public folder
4. Deploy to Vercel

## Advantages

✅ **No GitHub Pages setup needed**
✅ **No CORS issues**
✅ **Works with Vercel preview deployments**
✅ **Same infrastructure** (everything on Vercel)
✅ **Automatic deployment**
✅ **No 403 errors**
✅ **Faster** (served from CDN edge)

## Files Changed

```
✅ myapp/public/bundle.json.gz       - Bundle file (5 products)
✅ myapp/app/api/bundle/route.ts     - API route to serve bundle
✅ myapp/lib/sync.ts                 - Default URL changed to /api/bundle
✅ myapp/vercel.json                 - Added headers for /api/bundle
```

## Testing Locally

```bash
cd myapp
npm run dev

# In another terminal:
curl -s http://localhost:3001/api/bundle | gunzip | jq '.productCount'
# Should return: 5

# Test sync in browser:
# http://localhost:3001
# Settings → Sync Now → Should work!
```

## Production Checklist

After deploying to Vercel:

- [ ] Bundle endpoint accessible: `/api/bundle` returns gzipped data
- [ ] CORS headers present: `Access-Control-Allow-Origin: *`
- [ ] Bundle has 5 products: `jq '.productCount'` returns 5
- [ ] Sync works in MyApp
- [ ] Products display on home page

## Troubleshooting

### Bundle returns 404
- Check `myapp/public/bundle.json.gz` exists
- Redeploy to Vercel

### Sync fails with CORS error
- Check vercel.json headers are deployed
- Clear browser cache

### Bundle shows 0 products
- Regenerate bundle from database
- Verify bundle locally: `zcat myapp/public/bundle.json.gz | jq '.productCount'`
- Redeploy

## Summary

**Old way:** PDG → GitHub Pages → MyApp (403 errors ❌)

**New way:** PDG → MyApp (Vercel) → Sync ✅

Everything is self-contained in your Vercel deployment!
