# Deployment Guide

Complete deployment guide for Product Data Generator (PDG) and MyApp PWA companion.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Your Infrastructure                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐      ┌──────────────┐      ┌───────────┐ │
│  │     PDG      │      │    MyApp     │      │  Bundle   │ │
│  │   Main App   │      │  PWA Mobile  │      │  GitHub   │ │
│  │              │      │  Companion   │      │   Pages   │ │
│  │  Vercel/     │      │  Vercel/     │      │           │ │
│  │  Netlify     │      │  Netlify     │      │   FREE    │ │
│  │              │      │              │      │           │ │
│  │   FREE       │      │   FREE       │      │           │ │
│  └──────────────┘      └──────────────┘      └───────────┘ │
│       │                      │                      ▲       │
│       │                      │                      │       │
│       │                      └──────────────────────┘       │
│       │                         Fetches bundle             │
│       │                                                     │
│       ▼                                                     │
│  ┌──────────────────────────────────────────────────┐      │
│  │            Local SQLite Database                 │      │
│  │         (on Vercel/Netlify filesystem)           │      │
│  └──────────────────────────────────────────────────┘      │
│                                                              │
│  ┌──────────────────────────────────────────────────┐      │
│  │         Claude MCP Server (Optional)             │      │
│  │      Automates bundle generation from            │      │
│  │           data/products.ndjson                   │      │
│  └──────────────────────────────────────────────────┘      │
│                          │                                  │
│                          ▼                                  │
│  ┌──────────────────────────────────────────────────┐      │
│  │         GitHub Actions (Optional)                │      │
│  │    Auto-triggers on data/ changes, nightly       │      │
│  └──────────────────────────────────────────────────┘      │
│                                                              │
└─────────────────────────────────────────────────────────────┘

Total Monthly Cost: $0 (100% free for single user)
```

## Prerequisites

- Node.js 18+ installed
- Git installed
- GitHub account (free)
- Vercel or Netlify account (free tier)

## Part 1: Deploy PDG (Main App)

### Step 1: Prepare Environment

1. Clone your repository:
   ```bash
   git clone https://github.com/yourusername/product-data-generator.git
   cd product-data-generator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local`:
   ```env
   DATABASE_URL="file:./prisma/dev.db"
   PDG_AUTH_USERNAME="admin"
   PDG_AUTH_PASSWORD="your-secure-password"
   PDG_AUTH_SESSION_SECRET="your-secret-key-min-32-chars"

   # Optional: AI autofill (leave empty to use free templates)
   AI_API_KEY=""
   AI_API_URL=""
   ```

4. Initialize database:
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

5. Test locally:
   ```bash
   npm run dev
   ```
   Visit http://localhost:3000

### Step 2: Deploy to Vercel

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. Follow prompts:
   - Project name: `product-data-generator`
   - Framework: Next.js (auto-detected)
   - Root directory: `./`
   - Build settings: Use defaults

5. Add environment variables in Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add each variable from `.env.local`
   - Mark `PDG_AUTH_SESSION_SECRET` as sensitive

6. Deploy to production:
   ```bash
   vercel --prod
   ```

7. Your PDG app is now live at: `https://product-data-generator.vercel.app`

### Step 2 (Alternative): Deploy to Netlify

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Login:
   ```bash
   netlify login
   ```

3. Initialize:
   ```bash
   netlify init
   ```

4. Configure:
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Functions directory: `.netlify/functions`

5. Add environment variables:
   ```bash
   netlify env:set DATABASE_URL "file:./prisma/dev.db"
   netlify env:set PDG_AUTH_USERNAME "admin"
   netlify env:set PDG_AUTH_PASSWORD "your-secure-password"
   netlify env:set PDG_AUTH_SESSION_SECRET "your-secret-key"
   ```

6. Deploy:
   ```bash
   netlify deploy --prod
   ```

7. Your PDG app is now live at: `https://product-data-generator.netlify.app`

## Part 2: Setup Bundle Automation

### Step 1: Enable GitHub Pages

1. Go to your repository on GitHub
2. Settings → Pages
3. Source: Deploy from branch
4. Branch: `gh-pages` (create if doesn't exist)
5. Folder: `/ (root)`
6. Click Save

### Step 2: Create Sample Data

Create `data/products.ndjson` with your product data:

```ndjson
{"id":"p001","category":"health","pointValue":100,"texts":[{"language":"en","name":"Vitamin C","description":"Supports immune system"}],"tags":["vitamin","health"],"createdAt":"2025-01-01T00:00:00Z","updatedAt":"2025-01-01T00:00:00Z"}
{"id":"p002","category":"cosmetic","pointValue":50,"texts":[{"language":"en","name":"Face Cream","description":"Moisturizing face cream"}],"tags":["skincare"],"createdAt":"2025-01-01T00:00:00Z","updatedAt":"2025-01-01T00:00:00Z"}
```

You can export from PDG via the "Export Data" button, then convert to NDJSON.

### Step 3: Setup MCP Server (Optional but Recommended)

1. Install dependencies:
   ```bash
   cd mcp-server
   npm install
   ```

2. Create GitHub Personal Access Token:
   - Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Click "Generate new token (classic)"
   - Scopes: `repo` (all permissions)
   - Copy the token (starts with `ghp_`)

3. Create `mcp-server/.env`:
   ```env
   GITHUB_TOKEN=ghp_your_token_here
   GITHUB_OWNER=yourusername
   GITHUB_REPO=product-data-generator
   ```

4. Test bundle generation:
   ```bash
   node index.js
   ```

5. Verify bundle was published:
   - Go to your repo → branches → `gh-pages`
   - Check for `bundle.json.gz` file

6. Bundle URL will be:
   ```
   https://yourusername.github.io/product-data-generator/bundle.json.gz
   ```

### Step 4: Setup GitHub Actions (Optional)

The workflow is already configured in `.github/workflows/publish-bundle.yml`.

To enable it:

1. Add GitHub token as repository secret:
   - Go to your repo Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `GITHUB_TOKEN` (already provided by GitHub)
   - No action needed - this secret is automatically available

2. Test the workflow:
   - Make a change to `data/products.ndjson`
   - Commit and push:
     ```bash
     git add data/products.ndjson
     git commit -m "Update products"
     git push
     ```

3. Check workflow:
   - Go to Actions tab in your GitHub repo
   - You should see "Publish PDG Bundle" running
   - Wait for it to complete (green checkmark)

4. Verify bundle was updated:
   - Visit: `https://yourusername.github.io/product-data-generator/bundle.json.gz`
   - Should download a gzipped file

The workflow will now:
- Auto-run when you push changes to `data/` directory
- Run nightly at 2 AM UTC
- Can be manually triggered from Actions tab

## Part 3: Deploy MyApp (PWA Companion)

### Step 1: Prepare MyApp

1. Install dependencies:
   ```bash
   cd myapp
   npm install
   ```

2. Create `myapp/.env.local`:
   ```env
   NEXT_PUBLIC_BUNDLE_URL=https://yourusername.github.io/product-data-generator/bundle.json.gz
   ```

3. Update the bundle URL with your actual GitHub Pages URL

4. Test locally:
   ```bash
   npm run dev
   ```
   Visit http://localhost:3001

### Step 2: Deploy MyApp to Vercel

1. Deploy from myapp directory:
   ```bash
   cd myapp
   vercel
   ```

2. Follow prompts:
   - Project name: `myapp-pdg`
   - Framework: Next.js
   - Root directory: `./`

3. Add environment variable in Vercel dashboard:
   - `NEXT_PUBLIC_BUNDLE_URL` = your bundle URL

4. Deploy to production:
   ```bash
   vercel --prod
   ```

5. Your MyApp is now live at: `https://myapp-pdg.vercel.app`

### Step 2 (Alternative): Deploy MyApp to Netlify

1. From myapp directory:
   ```bash
   cd myapp
   netlify init
   ```

2. Configure:
   - Build command: `npm run build`
   - Publish directory: `.next`

3. Add environment variable:
   ```bash
   netlify env:set NEXT_PUBLIC_BUNDLE_URL "https://yourusername.github.io/product-data-generator/bundle.json.gz"
   ```

4. Deploy:
   ```bash
   netlify deploy --prod
   ```

5. Your MyApp is now live at: `https://myapp-pdg.netlify.app`

### Step 3: Test MyApp

1. Open MyApp on your mobile device or browser
2. Go to Settings tab
3. Verify bundle URL is correct
4. Tap "Sync Now"
5. Should download products and show count
6. Navigate to Home tab - should see product list
7. Test offline mode:
   - Enable airplane mode or disable network
   - Refresh the app
   - Should still work perfectly

### Step 4: Install as PWA

**On iPhone:**
1. Open MyApp in Safari
2. Tap Share button (box with arrow)
3. Tap "Add to Home Screen"
4. Tap "Add"
5. Launch from home screen - works like native app!

**On Android:**
1. Open MyApp in Chrome
2. Tap menu (3 dots)
3. Tap "Install app" or "Add to Home screen"
4. Launch from home screen

## Part 4: Configuration & Customization

### Change Authentication Credentials

1. Update environment variables in Vercel/Netlify:
   ```
   PDG_AUTH_USERNAME=newusername
   PDG_AUTH_PASSWORD=newpassword
   ```

2. Redeploy or wait for automatic deployment

### Add AI Autofill

1. Get API key from OpenAI, Anthropic, or other provider

2. Add to environment variables:
   ```
   AI_API_KEY=your-api-key
   AI_API_URL=https://api.openai.com/v1/chat/completions
   ```

3. Redeploy

4. AI autofill will now work in PDG

### Customize MyApp Theme

Edit `myapp/app/globals.css`:

```css
:root {
  --bg: #ffffff;           /* Background color */
  --fg: #0a0a0a;           /* Text color */
  --accent: #2563eb;       /* Accent color (blue) */
  --accent-hover: #1d4ed8; /* Hover state */
  --border: #e5e7eb;       /* Border color */
  --danger: #ef4444;       /* Danger color (red) */
}
```

Redeploy to apply changes.

### Add Custom Domain

**Vercel:**
1. Go to Project Settings → Domains
2. Add your domain (e.g., `myapp.yourdomain.com`)
3. Follow DNS configuration instructions

**Netlify:**
1. Go to Site settings → Domain management
2. Add custom domain
3. Follow DNS configuration instructions

## Part 5: Maintenance

### Update Products in PDG

1. Login to PDG app
2. Add/edit products via the UI
3. Use "Export Data" button to download JSON
4. Convert to NDJSON format
5. Update `data/products.ndjson` in your repo
6. Commit and push - GitHub Actions will auto-update bundle

### Manual Bundle Update (Without MCP)

1. Export products from PDG as JSON
2. Convert to NDJSON:
   ```bash
   # If you have a JSON array in products.json
   jq -c '.products[]' products.json > data/products.ndjson
   ```

3. Generate bundle manually:
   ```bash
   cd mcp-server
   node build-bundle.js
   ```

4. Push to gh-pages branch:
   ```bash
   git checkout gh-pages
   cp ../bundle.json.gz .
   git add bundle.json.gz
   git commit -m "Update bundle"
   git push origin gh-pages
   ```

### Monitor Usage

**Vercel:**
- Go to Project → Analytics
- View requests, bandwidth, function invocations
- Free tier: 100GB bandwidth/month

**Netlify:**
- Go to Site → Analytics
- View page views, bandwidth
- Free tier: 100GB bandwidth/month

**GitHub Pages:**
- No built-in analytics
- 100GB bandwidth/month (soft limit)

### Backup Data

**PDG Database:**
1. Download `prisma/dev.db` from Vercel/Netlify deployment
2. Or use "Export Data" button in PDG UI

**MyApp Data:**
1. Open MyApp → Settings
2. Tap "Export Data"
3. Saves JSON file with all products, drafts, logs

### Troubleshooting

**PDG not loading:**
- Check environment variables are set
- Verify DATABASE_URL is correct
- Check build logs in Vercel/Netlify

**MyApp not syncing:**
- Verify bundle URL is correct in Settings
- Check bundle exists at GitHub Pages URL
- Verify GitHub Pages is enabled and deployed
- Check browser console for CORS errors

**GitHub Actions failing:**
- Check workflow logs in Actions tab
- Verify MCP server dependencies installed
- Check `data/products.ndjson` is valid NDJSON

**Quota exceeded:**
- PDG: Max 100 products (configurable in code)
- MyApp: Browser storage limit ~50-100MB
- Vercel/Netlify: 100GB bandwidth/month

## Cost Breakdown

| Service | Free Tier | Your Usage | Monthly Cost |
|---------|-----------|------------|--------------|
| Vercel (PDG) | 100GB bandwidth | <1GB | $0 |
| Vercel (MyApp) | 100GB bandwidth | <5GB | $0 |
| GitHub Pages | 100GB bandwidth | <1GB | $0 |
| GitHub Actions | 2000 min/month | <10 min | $0 |
| Database | Included | Local SQLite | $0 |
| AI (optional) | N/A | 0 (using templates) | $0 |
| **TOTAL** | | | **$0/month** |

## Security Checklist

- [ ] Changed default PDG_AUTH_PASSWORD
- [ ] PDG_AUTH_SESSION_SECRET is random (32+ chars)
- [ ] GitHub token has minimal required permissions (repo only)
- [ ] Environment variables marked as sensitive in Vercel/Netlify
- [ ] HTTPS enabled (automatic with Vercel/Netlify)
- [ ] GitHub repository is private (if handling sensitive data)
- [ ] Regular backups of database and data

## Support

For issues:
- PDG issues: Open issue in main repo
- MyApp issues: Open issue with [MyApp] prefix
- Deployment issues: Check Vercel/Netlify docs first

## Next Steps

1. ✅ Deploy PDG to Vercel/Netlify
2. ✅ Setup GitHub Pages for bundle hosting
3. ✅ Deploy MyApp to Vercel/Netlify
4. ✅ Test end-to-end sync from PDG → Bundle → MyApp
5. ✅ Install MyApp as PWA on your phone
6. ✅ Add custom domain (optional)
7. ✅ Setup monitoring (optional)

Congratulations! You now have a fully functional, 100% free, privacy-first product data management system! 🎉
