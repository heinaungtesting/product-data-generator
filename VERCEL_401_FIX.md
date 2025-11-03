# Fixing Vercel 401 Unauthorized Errors

## Problem
You're seeing 401 errors on Vercel preview deployments:
```
manifest.json:1 GET https://myproductcatalog-ibo2ypmof-heinaungtestings-projects.vercel.app/manifest.json 401 (Unauthorized)
```

## Root Cause
Vercel's **Preview Deployment Protection** is enabled, which requires authentication to access preview URLs.

## Solutions

### Solution 1: Disable Preview Protection (Recommended for Public PWAs)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `myproductcatalog`
3. Go to **Settings** → **Deployment Protection**
4. Under **Preview Deployment Protection**:
   - Set to: **Disabled** or **Only Vercel Users**
5. Click **Save**
6. Redeploy or access your **Production URL** instead

### Solution 2: Use Production URL

Instead of the preview URL:
```
❌ https://myproductcatalog-ibo2ypmof-heinaungtestings-projects.vercel.app
```

Use your production URL (after deploying to production):
```
✅ https://myproductcatalog.vercel.app
```

To deploy to production:
```bash
cd myapp
vercel --prod
```

### Solution 3: Authenticate on Preview

If you want to keep protection enabled:
1. Visit the preview URL
2. Enter the password (check Vercel dashboard for password)
3. After authentication, the app will work

## Additional Fixes

### Fix 1: Remove logo.svg Error

The error `logo.svg:1 Failed to load resource` suggests there's a reference to a non-existent file. We created `icon.svg` instead.

**Check for references:**
```bash
cd myapp
grep -r "logo.svg" app/ components/ public/
```

If found, replace with `icon.svg`.

### Fix 2: Environment Variables

Ensure environment variables are configured in Vercel:

1. **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

2. Add:
   ```
   Key: NEXT_PUBLIC_BUNDLE_URL
   Value: https://heinaungtesting.github.io/product-data-generator/bundle.json.gz
   ```

3. Select: **Production**, **Preview**, **Development**

4. Click **Save**

5. **Redeploy** (required for env vars to take effect)

### Fix 3: Manifest.json Headers

I've updated `vercel.json` to ensure proper headers for PWA resources.

## Testing After Fixes

### Test 1: Production Deployment
```bash
# Deploy to production
cd myapp
vercel --prod

# Access production URL (no password required)
# https://myproductcatalog.vercel.app
```

### Test 2: Check Manifest
Visit (replace with your production URL):
```
https://myproductcatalog.vercel.app/manifest.json
```

Should return JSON (not 401).

### Test 3: Sync Products
1. Open production URL
2. Go to Settings
3. Tap "Sync Now"
4. Should sync successfully

## Quick Commands

```bash
# Check deployment status
vercel ls

# Deploy to production
vercel --prod

# Check environment variables
vercel env ls

# Add environment variable
vercel env add NEXT_PUBLIC_BUNDLE_URL production
# Then paste: https://heinaungtesting.github.io/product-data-generator/bundle.json.gz
```

## Summary

**Main Issue:** Vercel preview protection requires authentication (401 errors)

**Fix:** Either:
1. Disable preview protection in Vercel settings
2. Use production URL instead of preview URL
3. Authenticate on preview deployment

**Then:** Products will sync and display correctly!
