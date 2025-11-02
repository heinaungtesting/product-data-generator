# MyApp Vercel Deployment Guide

## ⚠️ IMPORTANT: Root Directory Configuration

**MyApp MUST be deployed with the root directory set to `myapp`.**

If you don't configure this correctly, you'll get the error:
```
Type error: Cannot find module '@/lib/hooks' or its corresponding type declarations.
```

---

## 🚀 Quick Deploy (Recommended)

### Option 1: Deploy via Vercel CLI

```bash
cd myapp
vercel
```

When prompted:
- **Set up and deploy?** Yes
- **Which scope?** Your account
- **Link to existing project?** No
- **Project name?** myapp-pdg (or your choice)
- **Directory?** `./` (CLI will auto-detect you're in myapp)
- **Override settings?** No

Then deploy to production:
```bash
vercel --prod
```

### Option 2: Deploy via Vercel Dashboard

1. **Fork/Import Repository**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your `product-data-generator` repository

2. **⚠️ CRITICAL: Configure Root Directory**
   - In project settings, find "Root Directory"
   - Click "Edit"
   - Set to: `myapp`
   - Click "Save"

3. **Configure Build Settings**
   - Framework Preset: **Next.js** (auto-detected)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)

4. **Add Environment Variable**
   - Go to "Environment Variables" section
   - Add:
     - Key: `NEXT_PUBLIC_BUNDLE_URL`
     - Value: `https://YOUR_GITHUB_USERNAME.github.io/product-data-generator/bundle.json.gz`
   - Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)

---

## 🔧 Troubleshooting

### Error: Cannot find module '@/lib/hooks'

**Cause:** Root directory not set to `myapp`

**Solution:**
1. Go to Vercel project settings
2. General → Root Directory
3. Set to: `myapp`
4. Redeploy

### Error: Failed to fetch font 'Inter'

**Already Fixed:** We removed Google Fonts dependency. Update your repo:
```bash
git pull origin claude/optimize-local-privacy-app-011CUgaqpdEMSoo1wvoAJE2g
```

### Error: Cannot apply unknown utility class 'bg-bg'

**Already Fixed:** Downgraded to Tailwind CSS v3. Update your repo:
```bash
git pull origin claude/optimize-local-privacy-app-011CUgaqpdEMSoo1wvoAJE2g
```

### Build succeeds but app shows errors in browser

**Check:**
1. Environment variable `NEXT_PUBLIC_BUNDLE_URL` is set correctly
2. GitHub Pages is enabled and bundle is published
3. Bundle URL is accessible (try visiting it in browser)

---

## 📋 Pre-Deployment Checklist

- [ ] `myapp/package.json` exists
- [ ] `myapp/.gitignore` exists (excludes node_modules)
- [ ] `myapp/vercel.json` exists
- [ ] Root directory set to `myapp` in Vercel
- [ ] Environment variable `NEXT_PUBLIC_BUNDLE_URL` configured
- [ ] GitHub Pages enabled with bundle.json.gz
- [ ] Latest code pulled from git

---

## 🎯 Vercel Project Settings (Summary)

| Setting | Value |
|---------|-------|
| **Root Directory** | `myapp` ⚠️ CRITICAL |
| **Framework** | Next.js |
| **Build Command** | `npm run build` |
| **Output Directory** | `.next` |
| **Install Command** | `npm install` |
| **Node Version** | 18.x or higher |

### Environment Variables

| Key | Value | Notes |
|-----|-------|-------|
| `NEXT_PUBLIC_BUNDLE_URL` | `https://USERNAME.github.io/product-data-generator/bundle.json.gz` | Replace USERNAME |

---

## 📊 Expected Build Output

```
Route (app)                              Size     First Load JS
┌ ○ /                                    20.1 kB         181 kB
├ ○ /_not-found                          979 B           106 kB
└ ○ /settings                            1.64 kB         162 kB

○  (Static)  prerendered as static content

✓ Build completed successfully
```

Build time: ~2-3 minutes

---

## 🔄 Redeploying After Changes

### Via CLI:
```bash
cd myapp
git pull
vercel --prod
```

### Via Dashboard:
- Vercel auto-deploys on git push (if connected)
- Or click "Redeploy" in deployments tab

---

## 💡 Tips

1. **Test locally first:**
   ```bash
   cd myapp
   npm run build
   npm start
   ```

2. **Check build logs:**
   - Go to Vercel dashboard
   - Click on deployment
   - View build logs for detailed errors

3. **Environment variables:**
   - Changes require redeploy
   - Mark sensitive values as "Secret"

4. **Custom domain:**
   - Go to Settings → Domains
   - Add your domain
   - Configure DNS as instructed

---

## 🆘 Still Having Issues?

1. **Verify root directory:**
   ```bash
   # Should be in myapp directory
   pwd
   # Output: /path/to/product-data-generator/myapp
   ```

2. **Clean install:**
   ```bash
   cd myapp
   rm -rf node_modules package-lock.json .next
   npm install
   npm run build
   ```

3. **Check Vercel logs:**
   - Dashboard → Your Project → Deployments
   - Click failed deployment
   - Read full build log

4. **Contact for help:**
   - Include full build log
   - Include vercel.json content
   - Include project settings screenshot

---

## ✅ Success Indicators

- ✅ Build completes without errors
- ✅ Deployment shows green checkmark
- ✅ App loads at vercel.app URL
- ✅ No console errors in browser
- ✅ PWA installable (Lighthouse score 90+)

---

## 🎉 Post-Deployment

Once deployed:

1. **Test the app:**
   - Visit your-project.vercel.app
   - Go to Settings tab
   - Click "Sync Now"
   - Verify products load

2. **Install as PWA:**
   - On iPhone: Safari → Share → Add to Home Screen
   - On Android: Chrome → Menu → Install app

3. **Test offline:**
   - Enable airplane mode
   - App should still work!

---

## 📚 Related Documentation

- [../DEPLOYMENT.md](../DEPLOYMENT.md) - Full deployment guide
- [README.md](README.md) - MyApp documentation
- [../QUICK_START.md](../QUICK_START.md) - Quick start guide

---

## 💰 Cost

**$0/month** on Vercel free tier:
- 100GB bandwidth
- Unlimited deployments
- SSL certificate included
- Custom domains supported

Total cost for entire stack: **$0/month** 🎉
