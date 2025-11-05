# 🔄 Clear Browser Cache and Resync MyApp

## Issue: Seeing Old/Dummy Product Data

If you're seeing different product data in MyApp compared to what Claude Desktop shows via the MCP server, the issue is likely **cached data in your browser's IndexedDB**.

### Why This Happens
- **MCP Server (Claude Desktop):** Reads directly from SQLite database (`prisma/dev.db`) with latest data
- **MyApp (Browser):** Reads from IndexedDB, which stores synced products locally for offline access
- **Problem:** Your browser may have old data that hasn't been updated since the last sync

---

## ✅ Solution: Clear IndexedDB and Resync

### Method 1: Use Settings Page (Easiest)

1. Open MyApp in your browser
2. Go to **Settings** tab (gear icon)
3. Scroll down to **Clear Cache** section
4. Click **"Clear All Data"** button
5. Go back to **Home** tab
6. Click **"Sync Now"** button
7. Wait for sync to complete
8. Refresh the page (Ctrl+R or Cmd+R)

### Method 2: Browser DevTools (Most Thorough)

#### Chrome/Edge:
1. Open MyApp
2. Press **F12** to open DevTools
3. Go to **Application** tab
4. In left sidebar, find **Storage** section
5. Click **"IndexedDB"** → **"MyAppDB"**
6. Right-click on **"MyAppDB"** → **Delete database**
7. In left sidebar, click **Local Storage** → your app URL
8. Right-click → **Clear**
9. In left sidebar, click **Session Storage** → your app URL
10. Right-click → **Clear**
11. Close DevTools
12. Refresh page (Ctrl+Shift+R for hard refresh)
13. Click **"Sync Now"**

#### Firefox:
1. Open MyApp
2. Press **F12** to open DevTools
3. Go to **Storage** tab
4. In left sidebar, expand **"Indexed DB"**
5. Right-click **"MyAppDB"** → **Delete database**
6. Under **Local Storage**, right-click your app URL → **Delete All**
7. Under **Session Storage**, right-click your app URL → **Delete All**
8. Close DevTools
9. Refresh page (Ctrl+Shift+R)
10. Click **"Sync Now"**

#### Safari:
1. Open MyApp
2. Enable Developer Menu: Safari → Preferences → Advanced → Check "Show Develop menu"
3. Develop → Show Web Inspector → Storage tab
4. Click **Indexed Databases** → **MyAppDB** → Right-click → Delete
5. Click **Local Storage** → your app URL → Clear
6. Close Web Inspector
7. Refresh page (Cmd+Shift+R)
8. Click **"Sync Now"**

---

## 📊 Verify Correct Data

After clearing cache and resyncing, you should see these **5 real products**:

1. **Probiotic Complex** (Health, 85 points)
2. **Vitamin C Serum** (Cosmetic, 120 points)
3. **Omega-3 Fish Oil** (Health, 110 points)
4. **Hydrating Face Cream** (Cosmetic, 95 points)
5. **Vitamin C 1000mg** (Health, 75 points)

### How to Check:
1. Open MyApp
2. Look at product names on the home page
3. They should match the list above
4. If you see different names or "demo" products, try the clearing process again

---

## 🔍 Additional Troubleshooting

### Still Seeing Old Data?

1. **Check you're on the latest deployment:**
   - Make sure you're visiting the correct URL
   - Try visiting in an incognito/private window
   - Clear browser cache entirely (Ctrl+Shift+Delete)

2. **Hard refresh the page:**
   - Chrome/Edge/Firefox: **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)
   - Safari: **Cmd+Option+R**

3. **Check bundle URL in Settings:**
   - Go to Settings tab
   - Look for "Bundle URL" or "Sync Source"
   - It should point to `/api/bundle` (relative URL)
   - Or `https://your-app.vercel.app/api/bundle`

4. **Check console for errors:**
   - Press F12 → Console tab
   - Click "Sync Now"
   - Look for any error messages
   - Red text indicates problems with sync

5. **Verify bundle is correct:**
   - Visit: `https://your-app.vercel.app/api/bundle`
   - This should download a `.gz` file
   - Decompress it and check it has 5 products
   - Or check in DevTools: Network tab → Click "Sync Now" → Look for bundle request

### Network Issues?

If sync keeps failing:
- Check your internet connection
- Try using a VPN or different network
- Check if your firewall is blocking the request
- Look for CORS errors in console

### Still Not Working?

Create an issue with these details:
1. What products you're seeing (screenshot helpful)
2. Browser name and version
3. Console errors (if any)
4. Network tab showing bundle request/response
5. Whether you tried clearing cache

---

## 🎯 Expected Result

After following these steps:
- ✅ IndexedDB is empty
- ✅ Click "Sync Now" downloads fresh bundle
- ✅ 5 real products appear on home page
- ✅ Product names match the list above
- ✅ No "demo" or "sample" products
- ✅ All product details are real (not placeholder text)

---

## 💡 Tips to Avoid This in the Future

1. **Sync regularly:** Click "Sync Now" button periodically to get latest data
2. **Check last sync time:** Settings tab shows when you last synced
3. **Use production URL:** Development/preview URLs may have stale data
4. **Clear cache after updates:** When app is updated, clear cache and resync
5. **Test in incognito:** To see fresh data without clearing your main browser cache

---

## 🚀 Quick Commands for Developers

If you have command-line access to test bundle:

```bash
# Check bundle content
gunzip -c myapp/public/bundle.json.gz | jq '.products[].texts[0].name'

# Expected output:
# "Probiotic Complex"
# "Vitamin C Serum"
# "Omega-3 Fish Oil"
# "Hydrating Face Cream"
# "Vitamin C 1000mg"

# Rebuild bundle from database
cd mcp-server
node build-bundle-direct.js

# Copy to MyApp
cp ../dist/bundle.json.gz ../myapp/public/

# Commit and push
git add myapp/public/bundle.json.gz
git commit -m "Update bundle with latest products"
git push
```

---

## 📚 Related Documentation

- **READY_TO_DEPLOY.md** - Deployment guide
- **VERCEL_DEPLOYMENT.md** - Vercel-specific instructions
- **myapp/README.md** - MyApp documentation

---

**Remember:** The bundle file (`myapp/public/bundle.json.gz`) is the source of truth for MyApp. If MCP server shows different data, regenerate the bundle and redeploy.
