# Quick Start - Staff Point Management System

**Last Updated:** 2025-01-15
**Status:** Phase 1 Complete, Ready for Implementation

---

## 📋 TL;DR

**What we're building:**
- Keep your OLD project for managing products & staff
- Build NEW simple staff portal for staff to view points
- Both share same Supabase database

**Current status:**
- ✅ Database schema created
- ✅ Migration scripts ready
- ⏳ Waiting for you to set up Supabase

---

## 🚀 What YOU Need to Do (15 minutes)

### Step 1: Create Supabase Account

1. Go to **[supabase.com](https://supabase.com)**
2. Sign up with GitHub
3. Create new project:
   - Name: `product-manager` (or anything)
   - Password: Generate strong password (SAVE IT!)
   - Region: Choose closest to you
   - Plan: **Free** ($0/month)
4. Wait 2 minutes for setup

### Step 2: Get API Keys

1. In Supabase dashboard → **Settings** → **API**
2. Copy these 3 values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: `eyJhbGc...` (long key)
   - **service_role**: Click "Reveal" then copy (⚠️ keep secret!)

### Step 3: Configure Locally

```bash
# 1. Copy environment file
cp .env.local.example .env.local

# 2. Edit .env.local and paste your Supabase credentials
# Open .env.local in editor and replace:
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGc..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."
```

### Step 4: Install & Test

```bash
# Install dependencies
npm install

# Apply database migrations
npx supabase db push

# Test connection (should show "ALL TESTS PASSED!")
npx tsx scripts/test-supabase-connection.ts
```

### Step 5: Migrate Your Data (Optional)

```bash
# If you have existing products in SQLite:
npm run db:migrate-to-supabase
```

---

## 🎉 Then Tell Claude Code

Once all tests pass, tell Claude Code:

**"Supabase is ready, start building"**

Claude will then:
1. Add staff management to your old project (2 hours)
2. Create new clean staff portal (4 hours)
3. Update MCP server (1 hour)
4. Help you deploy both (30 min)

**Total: 7-8 hours = Done in 1 day!**

---

## 📁 Key Files to Read

| File | Purpose |
|------|---------|
| **`docs/SESSION_SUMMARY.md`** | Complete context & architecture |
| **`SUPABASE_SETUP_GUIDE.md`** | Detailed Supabase setup guide |
| **`docs/DUAL_PROJECT_PLAN.md`** | Technical implementation plan |

---

## 🏗️ Architecture (Quick View)

```
┌─────────────────────────────────┐
│   Supabase (Shared Database)    │
└────────┬────────────────────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼──────┐
│  OLD  │ │   NEW   │
│PROJECT│ │ PROJECT │
│       │ │         │
│ You   │ │  Staff  │
│ Use   │ │  Use    │
└───────┘ └─────────┘
```

**OLD Project (product-data-generator):**
- Keep everything as-is
- Add: Staff management + Point logging
- You use this

**NEW Project (staff-portal):**
- Brand new, clean, simple
- Staff login, view points, history, calendar
- Staff use this on phones

---

## ⚡ Quick Troubleshooting

**"npm install fails"**
```bash
rm -rf node_modules package-lock.json
npm install
```

**"supabase db push fails"**
- Check .env.local has correct credentials
- Make sure Supabase project is not paused
- Try: `npx supabase login` first

**"Connection test fails"**
- Verify NEXT_PUBLIC_SUPABASE_URL in .env.local
- Check both API keys are correct
- Restart terminal to reload env vars

**"Table already exists" error**
- Tables already created, that's fine!
- Skip to testing: `npx tsx scripts/test-supabase-connection.ts`

---

## 🎯 What Gets Built

### Your Old Project Gets:
- ✅ Staff management page
- ✅ "Log Sale" button on products
- ✅ Point tracking

### New Staff Portal Has:
- ✅ Simple login (email or PIN)
- ✅ Points dashboard
- ✅ Transaction history
- ✅ Calendar view

**Both connect to same database = Real-time sync!**

---

## 📞 Need Help?

**If stuck on Supabase setup:**
- Read: `SUPABASE_SETUP_GUIDE.md`
- Check: Supabase dashboard isn't showing errors
- Verify: API keys copied correctly (no extra spaces)

**If ready to continue:**
- Tell Claude Code: "Supabase is ready"
- Or: "Start building the staff features"

---

## ✅ Checklist

Before telling Claude to start:

- [ ] Supabase account created
- [ ] Project created and active (not paused)
- [ ] API keys copied to `.env.local`
- [ ] `npm install` completed successfully
- [ ] `npx supabase db push` completed
- [ ] `npx tsx scripts/test-supabase-connection.ts` shows "ALL TESTS PASSED"
- [ ] (Optional) Existing data migrated

**When all checked, you're ready!** 🚀

---

**Questions?** Ask Claude Code - it has full context in `docs/SESSION_SUMMARY.md`
