# GitHub Pages Quick Fix

## Issue

GitHub Pages is returning 403 or serving corrupt data even though the bundle exists on the gh-pages branch with 5 products.

## Solution

GitHub Pages needs to be configured in the repository settings:

### Step 1: Enable GitHub Pages

1. Go to: https://github.com/heinaungtesting/product-data-generator/settings/pages

2. Under **"Source"**:
   - Select: **Deploy from a branch**

3. Under **"Branch"**:
   - Branch: **gh-pages**
   - Folder: **/ (root)**

4. Click **Save**

5. Wait 1-2 minutes for deployment

### Step 2: Verify Deployment

After 1-2 minutes, check:

```bash
curl -I https://heinaungtesting.github.io/product-data-generator/bundle.json.gz
```

Should return:
```
HTTP/2 200
content-type: application/gzip
```

### Step 3: Test Bundle

```bash
curl -s https://heinaungtesting.github.io/product-data-generator/bundle.json.gz | gunzip | jq '.productCount'
```

Should return: `5`

### Step 4: Test Sync in MyApp

1. Open MyApp (Vercel deployment)
2. Clear data: F12 → Application → Clear Storage → Clear site data
3. Refresh page
4. Go to Settings → Sync Now
5. Should see: "✅ Synced 5 products"
6. Go to Home → See all 5 products!

## Alternative: Force Redeploy

If GitHub Pages is already enabled but not updating:

```bash
# Trigger a new commit on gh-pages
git checkout gh-pages
git commit --allow-empty -m "Trigger GitHub Pages rebuild"
git push origin gh-pages
```

Wait 1-2 minutes and test again.

## Verification

The bundle on gh-pages branch is correct:
- ✅ 5 products
- ✅ 1755 bytes (compressed)
- ✅ Proper schema with texts

Just needs GitHub Pages to serve it!
