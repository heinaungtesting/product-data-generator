# Product Data Generator

A **fully local, privacy-first** product catalog manager built with Next.js, TypeScript, Prisma, and Tailwind CSS. Perfect for single users who want to manage multilingual product data without relying on external services or paid subscriptions.

## ✨ Key Features

- **100% Local Storage** - SQLite database, no cloud services required
- **Offline Support** - PWA with service worker for offline use
- **Privacy First** - All data stays on your machine
- **Free to Host** - Deploy to Vercel, Netlify, or run locally
- **No Paid Dependencies** - AI autofill is optional with free fallback
- **Optimized for Small Catalogs** - Max 100 items for optimal performance
- **Multilingual Support** - Japanese, English, Thai, Korean, Chinese
- **Auto-save Drafts** - Never lose your work
- **Data Export** - Download all your data as JSON anytime

## 🚀 Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Copy environment template**:
   ```bash
   cp .env.local.example .env.local
   ```
   Edit `.env.local` and set your username/password:
   ```env
   PDG_AUTH_USERNAME="admin"
   PDG_AUTH_PASSWORD="your-secure-password"
   PDG_AUTH_SESSION_SECRET="random-secret-key"
   DATABASE_URL="file:./prisma/dev.db"
   ```

3. **Initialize database**:
   ```bash
   npm run db:migrate
   ```

4. **Start the app**:
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)** and log in with your credentials!

## 📦 Features

### Core Functionality
- ✅ Search and filter products by name, category, tags
- ✅ Multilingual product descriptions (5 languages)
- ✅ Auto-save drafts every 800ms
- ✅ Draft recovery if newer version exists
- ✅ Validation for banned Japanese words
- ✅ NDJSON import/export
- ✅ JSON data export for backup
- ✅ Automatic bundle generation
- ✅ 100-item limit for optimal local performance

### Privacy & Offline
- ✅ All data stored locally in SQLite
- ✅ PWA support for offline use
- ✅ No external dependencies required
- ✅ No tracking or analytics
- ✅ Export your data anytime

### Optional Features
- **AI Autofill** (optional, works without it)

  If you want to use AI autofill, add to `.env.local`:
  ```env
  AI_KEY="your-google-api-key"
  AI_AUTOFILL_URL="https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
  ```

## 🔧 Environment Variables

| Variable                | Required | Description                                                    |
| ----------------------- | -------- | -------------------------------------------------------------- |
| `DATABASE_URL`          | Yes      | SQLite database path (default: `file:./prisma/dev.db`)        |
| `PDG_AUTH_USERNAME`     | Yes      | Username for login                                              |
| `PDG_AUTH_PASSWORD`     | Yes      | Password for login                                              |
| `PDG_AUTH_SESSION_SECRET` | Yes    | Secret key for session encryption                               |
| `AI_KEY`                | No       | Optional Google Gemini API key for AI autofill                  |
| `AI_AUTOFILL_URL`       | No       | Optional AI endpoint URL                                        |

> **Note**: Never commit `.env.local` to version control!

## 📜 Available Scripts

- `npm run dev` – Start development server
- `npm run build` – Create production build
- `npm run start` – Start production server
- `npm run lint` – Run ESLint
- `npm run db:migrate` – Apply database migrations
- `npm run schema:json` – Regenerate JSON schema
- `npm test` – Run tests

## 🌐 Deployment

### Vercel (Free Tier)
1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy!

### Netlify (Free Tier)
1. Push to GitHub
2. Import in Netlify
3. Add environment variables
4. Build command: `npm run build`
5. Publish directory: `.next`

### Self-Hosted
```bash
npm run build
npm run start
```

## 🔒 Privacy & Security

- **Local First**: All data stored in local SQLite database
- **No Cloud Services**: No Supabase, Firebase, or other external DBs
- **No Analytics**: Zero tracking
- **Simple Auth**: Username/password with session cookies
- **Offline Capable**: Works without internet connection
- **Data Ownership**: Export all data as JSON anytime

## 💾 Data Management

- **Max Items**: 100 products (optimized for single-user local storage)
- **Export**: Click "Export Data" to download JSON backup
- **Import**: Use NDJSON format for bulk import
- **Backup**: All data in `prisma/dev.db` - backup this file regularly

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: SQLite via Prisma
- **Styling**: Tailwind CSS 4
- **Validation**: Zod
- **Language**: TypeScript
- **PWA**: Custom service worker for offline support

## 📝 License

This project is optimized for local, single-user deployment. Feel free to modify for your needs!

## 🤝 Contributing

This is a personal project optimized for simplicity and privacy. Fork and customize as needed!

## 📧 Support

For issues or questions, please open a GitHub issue.

---

**Built with privacy and simplicity in mind. No subscriptions. No cloud lock-in. Just local data you control.**
