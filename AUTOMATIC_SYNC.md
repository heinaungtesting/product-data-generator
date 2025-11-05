# Automatic Bundle Sync Setup

## 🤖 Overview

This setup automatically syncs the bundle from `prisma/dev.db` to `myapp/public/bundle.json.gz` whenever you push database changes to GitHub.

**No manual script needed!** 🎉

---

## ✅ How It Works

### Automatic Workflow

```
1. Add product via MCP → prisma/dev.db updated
                           ↓
2. Commit and push →      git add prisma/dev.db
                          git commit -m "Add product"
                          git push
                           ↓
3. GitHub Actions →       Detects database change
   (Automatic!)           Runs build-bundle-direct.js
                          Copies to myapp/public/
                          Commits bundle
                           ↓
4. Vercel deploys →       Auto-deploys new bundle
   (Automatic!)
                           ↓
5. MyApp syncs →          Users get new products!
```

**You only need to push the database changes - everything else is automatic!**

---

## 🚀 Quick Start

### Step 1: Enable GitHub Actions

GitHub Actions should be enabled by default. Verify:

1. Go to your repo on GitHub
2. Click **Actions** tab
3. If disabled, click "I understand my workflows, go ahead and enable them"

### Step 2: Push Database Changes

After adding products via MCP:

```bash
# Commit database
git add prisma/dev.db
git commit -m "feat: Add new products"

# Push to GitHub
git push
```

**That's it!** GitHub Actions will automatically:
- ✅ Generate bundle from database
- ✅ Copy to myapp/public/bundle.json.gz
- ✅ Commit the updated bundle
- ✅ Trigger Vercel deployment

### Step 3: Wait for Automation

**Timeline:**
- GitHub Actions: ~1-2 minutes
- Vercel deployment: ~1-2 minutes
- **Total: ~2-4 minutes**

**Track progress:**
1. GitHub repo → **Actions** tab → See workflow running
2. Vercel dashboard → See deployment triggered
3. Check commits → New commit "chore: Auto-sync bundle..."

### Step 4: Test in MyApp

1. Open MyApp in browser
2. Clear cache (F12 → Delete IndexedDB)
3. Click "Sync Now"
4. New products appear! 🎉

---

## 📋 GitHub Actions Workflow

### What It Does

The workflow (`.github/workflows/sync-bundle.yml`) runs when:
- ✅ `prisma/dev.db` changes
- ✅ `data/products.ndjson` changes
- ✅ On branches: `claude/**` or `main`

### Steps Performed

1. **Checkout code** - Gets latest repo
2. **Setup Node.js** - Installs Node 18
3. **Install dependencies** - Installs better-sqlite3, pako
4. **Generate bundle** - Runs `build-bundle-direct.js`
5. **Copy to MyApp** - Copies to `myapp/public/`
6. **Show contents** - Logs product names
7. **Auto-commit** - Commits bundle with `[skip ci]`

### Workflow Triggers

```yaml
on:
  push:
    paths:
      - 'prisma/dev.db'      # Database changes
      - 'data/products.ndjson' # NDJSON changes
    branches:
      - 'claude/**'           # Your feature branches
      - 'main'                # Main branch
```

---

## 🔧 Configuration

### Workflow File Location

```
.github/
└── workflows/
    └── sync-bundle.yml
```

### Customization Options

**Change branches:**
```yaml
branches:
  - 'main'
  - 'develop'
  - 'feature/**'
```

**Add more paths:**
```yaml
paths:
  - 'prisma/dev.db'
  - 'data/**'
  - 'add-real-products.mjs'
```

**Change Node version:**
```yaml
node-version: '20'  # Use Node 20 instead of 18
```

---

## 🎯 Usage Examples

### Example 1: Add Single Product

```bash
# 1. Add via MCP in Claude Desktop
# (Product added to prisma/dev.db)

# 2. Commit and push
git add prisma/dev.db
git commit -m "feat: Add Bufferin Premium DX"
git push

# 3. Wait 2-4 minutes
# ✅ GitHub Actions syncs bundle automatically
# ✅ Vercel deploys automatically

# 4. Test in MyApp
# Clear cache → Sync Now → See new product
```

### Example 2: Bulk Add Products

```bash
# 1. Run migration script
node add-real-products.mjs

# 2. Commit and push
git add prisma/dev.db
git commit -m "feat: Add 10 new health products"
git push

# 3. GitHub Actions handles the rest!
```

### Example 3: Update Existing Product

```bash
# 1. Update via MCP
# (Database updated)

# 2. Commit and push
git add prisma/dev.db
git commit -m "fix: Update product description"
git push

# 3. Automatic sync and deploy
```

---

## 📊 Monitoring

### Check GitHub Actions Status

**Web UI:**
1. Go to repo on GitHub
2. Click **Actions** tab
3. See "Auto-sync Bundle" workflow
4. Click to see details/logs

**CLI:**
```bash
# Install GitHub CLI
brew install gh  # or: sudo apt install gh

# Check workflow status
gh run list --workflow=sync-bundle.yml

# View logs
gh run view --log
```

### Check Vercel Deployment

**Web UI:**
1. Go to Vercel dashboard
2. Select your project
3. See deployments list
4. Latest deployment triggered by GitHub

**CLI:**
```bash
# Install Vercel CLI
npm i -g vercel

# Check deployments
vercel ls

# Get deployment URL
vercel --prod
```

---

## 🐛 Troubleshooting

### Workflow Not Running

**Check:**
- ✅ GitHub Actions enabled in repo settings
- ✅ Pushed to correct branch (`claude/**` or `main`)
- ✅ Changed `prisma/dev.db` or `data/products.ndjson`
- ✅ Workflow file exists: `.github/workflows/sync-bundle.yml`

**Debug:**
```bash
# Check if workflow file is committed
git ls-files .github/workflows/

# Check current branch
git branch --show-current

# Check file changes in commit
git show --name-only
```

### Workflow Fails

**Common causes:**
1. **Dependencies fail** - Check Node version, npm install
2. **Database empty** - Run `node check-db.mjs`
3. **Build script fails** - Test locally: `cd mcp-server && node build-bundle-direct.js`

**View logs:**
- GitHub → Actions → Click failed run → See error details

### Bundle Not Updated in MyApp

**Possible issues:**
1. **Vercel not deployed** - Check Vercel dashboard
2. **Browser cache** - Clear IndexedDB and hard refresh
3. **Bundle not committed** - Check GitHub for auto-commit

**Verify bundle:**
```bash
# Download from production
curl https://your-app.vercel.app/api/bundle -o check.gz
gunzip -c check.gz | jq '.productCount'
```

### Auto-commit Not Working

**Check permissions:**
- Workflow uses `GITHUB_TOKEN` (automatically provided)
- `stefanzweifel/git-auto-commit-action` should handle commits

**Manual fallback:**
If auto-commit fails, the workflow will still run but won't commit. You can:
```bash
# Pull latest
git pull

# Run script manually
./sync-bundle.sh

# Or copy manually
cp dist/bundle.json.gz myapp/public/
git add myapp/public/bundle.json.gz
git commit -m "chore: Sync bundle"
git push
```

---

## 🔄 Workflow vs Manual Script

### When to Use Each

**GitHub Actions (Automatic) - Best for:**
- ✅ Regular product updates
- ✅ Team collaboration
- ✅ Hands-off workflow
- ✅ Production environments

**Manual Script (`./sync-bundle.sh`) - Best for:**
- ✅ Testing locally before push
- ✅ Offline development
- ✅ Custom commit messages
- ✅ Learning/debugging

### Can Use Both!

```bash
# Option 1: Test locally, then push for auto-deploy
./sync-bundle.sh         # Test locally
git push                 # Auto-sync triggers

# Option 2: Let GitHub Actions handle everything
git add prisma/dev.db
git commit -m "Add products"
git push                 # Auto-sync + auto-deploy
```

---

## 🎨 Advanced Usage

### Add Slack Notifications

Add to workflow:
```yaml
- name: Notify Slack
  if: success()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {
        "text": "Bundle synced! ${{ github.event.commits[0].message }}"
      }
```

### Add Email Notifications

Configure in repo settings:
- Settings → Notifications → Actions
- Enable email on workflow failure

### Run on Schedule

Add to workflow triggers:
```yaml
on:
  push:
    paths: [...]
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight
```

### Deploy to Multiple Environments

```yaml
- name: Deploy to staging
  run: vercel deploy --token=${{ secrets.VERCEL_TOKEN }}

- name: Deploy to production
  if: github.ref == 'refs/heads/main'
  run: vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

## ⚡ Performance

### Workflow Timing

| Step | Duration | Notes |
|------|----------|-------|
| Checkout | ~5s | Downloads repo |
| Setup Node | ~10s | Cached after first run |
| Install deps | ~20s | better-sqlite3 compilation |
| Generate bundle | ~1s | Direct SQLite access |
| Copy & commit | ~5s | File operations |
| **Total** | **~40s** | Plus queue time |

### Optimization Tips

1. **Cache dependencies:**
```yaml
- name: Cache node modules
  uses: actions/cache@v3
  with:
    path: node_modules
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

2. **Skip CI on auto-commits:**
```yaml
commit_message: 'chore: Auto-sync bundle [skip ci]'
```
(Already included to prevent infinite loops)

3. **Parallel jobs:**
```yaml
jobs:
  sync-bundle:
    # ... existing job

  deploy:
    needs: sync-bundle
    # ... deployment job
```

---

## 🔒 Security

### Secrets Used

**`GITHUB_TOKEN`:**
- Automatically provided by GitHub
- No setup required
- Permissions: Read/write repo

**Additional secrets (if needed):**
```bash
# Add in repo Settings → Secrets → Actions
VERCEL_TOKEN=...
SLACK_WEBHOOK=...
```

### Security Best Practices

- ✅ Workflow runs in isolated environment
- ✅ Only triggers on specific paths
- ✅ Uses official GitHub actions
- ✅ `[skip ci]` prevents infinite loops
- ✅ No sensitive data in logs

---

## 📚 Related Documentation

- **MCP_WORKFLOW.md** - Manual workflow guide
- **sync-bundle.sh** - Manual sync script
- **CLEAR_CACHE_INSTRUCTIONS.md** - Browser cache guide
- **READY_TO_DEPLOY.md** - Deployment guide

---

## ✅ Setup Checklist

- [ ] GitHub Actions enabled in repo
- [ ] `.github/workflows/sync-bundle.yml` committed
- [ ] Workflow tested (push database change)
- [ ] Vercel connected to GitHub repo
- [ ] Auto-deploy enabled in Vercel
- [ ] Tested end-to-end workflow
- [ ] Documented for team (if applicable)

---

## 🎉 Success Criteria

After setup, you should be able to:

1. **Add product via MCP** → Claude Desktop
2. **Commit database** → `git add prisma/dev.db && git commit -m "Add product"`
3. **Push to GitHub** → `git push`
4. **Wait 2-4 minutes** → ☕
5. **Open MyApp** → See new products!

**No manual script execution required!** 🚀

---

**Last Updated:** November 5, 2025
**Version:** 1.0
