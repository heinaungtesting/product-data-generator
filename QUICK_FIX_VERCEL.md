# 🚨 Quick Fix: Vercel 401 Errors

## What's Happening?

You're seeing **401 Unauthorized** errors because Vercel's **Preview Deployment Protection** is enabled on your preview URL.

**Your current URL (preview - requires password):**
```
https://myproductcatalog-ibo2ypmof-heinaungtestings-projects.vercel.app
```

## ⚡ Quick Solution (Choose One)

### Option 1: Deploy to Production (RECOMMENDED)

This gives you a clean URL without password protection:

```bash
cd myapp
vercel --prod
```

**Your production URL will be:**
```
https://myproductcatalog.vercel.app
```

No password needed! ✅

---

### Option 2: Disable Preview Protection

1. Go to: https://vercel.com/dashboard
2. Select project: **myproductcatalog**
3. Click: **Settings** → **Deployment Protection**
4. Find: **Preview Deployment Protection**
5. Change to: **Disabled**
6. Click: **Save**
7. Redeploy (or just refresh the page)

---

### Option 3: Authenticate (Quick Test)

If you just want to test now:
1. Visit your preview URL
2. Enter the password (shown in Vercel dashboard)
3. App will work after login

---

## 🔧 Configure Environment Variable

**IMPORTANT:** Add this in Vercel dashboard:

1. Go to: **Settings** → **Environment Variables**
2. Click: **Add New**
3. Enter:
   ```
   Name:  NEXT_PUBLIC_BUNDLE_URL
   Value: https://heinaungtesting.github.io/product-data-generator/bundle.json.gz
   ```
4. Select: **Production**, **Preview**, **Development** (all three)
5. Click: **Save**
6. **Redeploy** (required!)

Without this, sync won't work!

---

## 📱 About the logo.svg Error

The `logo.svg` certificate error is likely:
- A browser extension trying to load its icon
- Cached service worker reference
- Not from your app (we use `icon.svg`)

**To clear it:**
1. Open DevTools (F12)
2. Application → Clear Storage → Clear site data
3. Refresh

---

## ✅ After Fixing

Once you've:
- ✅ Deployed to production OR disabled preview protection
- ✅ Added environment variable
- ✅ Redeployed

**Then test:**

1. Open your app URL
2. Go to **Settings**
3. Tap **"Sync Now"**
4. Should show: **"✅ Synced 5 products"**
5. Go to **Home** - see 5 products!

---

## 🎯 Recommended Steps (In Order)

```bash
# 1. Pull latest changes
git checkout claude/optimize-local-privacy-app-011CUgaqpdEMSoo1wvoAJE2g
git pull

# 2. Deploy to production
cd myapp
vercel --prod

# 3. Copy your production URL (shown after deployment)
# Example: https://myproductcatalog.vercel.app

# 4. Visit Vercel dashboard and add env var:
# NEXT_PUBLIC_BUNDLE_URL=https://heinaungtesting.github.io/product-data-generator/bundle.json.gz

# 5. Redeploy to apply env var
vercel --prod

# 6. Open production URL and test sync!
```

---

## 📚 More Info

- Full guide: `VERCEL_401_FIX.md`
- Deployment guide: `myapp/VERCEL_DEPLOYMENT.md`

---

## Summary

**Problem:** Preview URL requires password (401 errors)

**Solution:** Deploy to production or disable preview protection

**Missing:** Environment variable for bundle URL

**After fixing:** Products will sync and display! 🎉
