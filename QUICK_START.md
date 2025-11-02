# Quick Start Guide

Get PDG and MyApp running in under 10 minutes.

## Prerequisites

- Node.js 18+ installed
- GitHub account
- Vercel or Netlify account (free)

## 🚀 5-Minute Setup

### 1. Install & Run Locally (2 min)

```bash
# Clone and install
git clone https://github.com/yourusername/product-data-generator.git
cd product-data-generator
npm install

# Create environment file
cp .env.local.example .env.local

# Edit .env.local and set your password:
# PDG_AUTH_PASSWORD="your-secure-password"

# Initialize database
npx prisma generate
npx prisma migrate deploy

# Run PDG
npm run dev
```

Visit http://localhost:3000 and login with:
- Username: `admin`
- Password: (what you set in .env.local)

### 2. Deploy PDG to Vercel (2 min)

```bash
# Install and login
npm install -g vercel
vercel login

# Deploy
vercel --prod
```

Add environment variables in Vercel dashboard:
- `DATABASE_URL` = `file:./prisma/dev.db`
- `PDG_AUTH_USERNAME` = `admin`
- `PDG_AUTH_PASSWORD` = your password
- `PDG_AUTH_SESSION_SECRET` = random 32+ character string

Your PDG is now live! 🎉

### 3. Setup Bundle + MyApp (1 min)

```bash
# Enable GitHub Pages in repo Settings → Pages → gh-pages branch

# Install MyApp dependencies
cd myapp
npm install

# Create env file
echo 'NEXT_PUBLIC_BUNDLE_URL=https://heinaungtesting.github.io/product-data-generator/bundle.json.gz' > .env.local

# Deploy MyApp
vercel --prod
```

Add `NEXT_PUBLIC_BUNDLE_URL` in Vercel dashboard with your GitHub Pages URL.

Your MyApp PWA is now live! 🎉

## 📱 Common Tasks

### Add Products in PDG

1. Login to your PDG deployment
2. Click "Add Product" button
3. Fill in product details (or use AI autofill)
4. Save

### Update Bundle for MyApp

**Automatic (Recommended):**
```bash
# Just push changes to data/ directory
git add data/products.ndjson
git commit -m "Update products"
git push
# GitHub Actions will auto-update bundle
```

**Manual:**
```bash
cd mcp-server
npm install
node build-bundle.js
```

### Sync MyApp with New Data

1. Open MyApp
2. Go to Settings tab
3. Tap "Sync Now"
4. Products updated! ✅

### Export Data from PDG

1. Login to PDG
2. Click "Export Data" button in header
3. JSON file downloads

### Install MyApp as PWA

**iPhone:**
Safari → Share → Add to Home Screen

**Android:**
Chrome → Menu → Install app

## 🎯 Production Checklist

Before going live:

- [ ] Changed PDG_AUTH_PASSWORD from default
- [ ] Set PDG_AUTH_SESSION_SECRET to random 32+ chars
- [ ] PDG deployed to Vercel/Netlify
- [ ] GitHub Pages enabled for bundle
- [ ] MyApp deployed to Vercel/Netlify
- [ ] Bundle URL configured in MyApp
- [ ] Test sync works (MyApp → Settings → Sync Now)
- [ ] Test offline mode in MyApp
- [ ] Install MyApp as PWA on phone
- [ ] Backup database (Export Data button)

## 🔧 Troubleshooting

**Can't login to PDG**
- Check PDG_AUTH_USERNAME and PDG_AUTH_PASSWORD in env vars
- Default username is `admin`

**MyApp shows "No products found"**
- Check bundle URL in Settings
- Verify GitHub Pages is enabled and deployed
- Run bundle generation: `cd mcp-server && node build-bundle.js`

**TypeScript build errors**
- Run `npx prisma generate`
- Delete `.next` folder and rebuild

**Database errors**
- Run `npx prisma migrate deploy`
- Check DATABASE_URL is correct

## 📚 Full Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Complete deployment guide
- [myapp/README.md](./myapp/README.md) - MyApp documentation
- [README.md](./README.md) - Project overview

## 💡 Tips

- **Free hosting**: Vercel/Netlify both have generous free tiers
- **Offline-first**: MyApp works 100% offline after first sync
- **Privacy**: All data stored locally, no tracking
- **AI optional**: Leave AI_API_KEY empty to use free templates
- **Limits**: Max 100 products in PDG (configurable)
- **Backup**: Use Export Data button regularly

## 🆘 Need Help?

Open an issue in the GitHub repo with:
- What you're trying to do
- What error you're seeing
- Steps you've already tried

## 🎉 Success!

You now have:
- ✅ PDG running on Vercel/Netlify (free)
- ✅ MyApp PWA on Vercel/Netlify (free)
- ✅ Auto-updating bundle on GitHub Pages (free)
- ✅ 100% offline capability
- ✅ Privacy-first, local data storage
- ✅ Zero monthly costs

Total time: ~10 minutes
Total cost: $0/month

Enjoy your product data management system! 🚀
