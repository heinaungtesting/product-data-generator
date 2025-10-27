## Product Data Generator

This project bundles a Product Data Generator built with Next.js App Router, TypeScript, Prisma, and Tailwind CSS. It lets you author catalog entries backed by SQLite, autosaves in-progress drafts, validates copy against a shared Zod schema package, and continuously rebuilds a distributable bundle.

## Setup

1. Install dependencies (already done if you ran `npm install`):
   ```bash
   npm install
   ```
2. Copy the environment template and populate it with your credentials:
   ```bash
   cp .env.local.example .env.local
   ```
   - `PDG_AUTH_USERNAME` and `PDG_AUTH_PASSWORD` gate access to the UI. Only requests with a valid login session can view pages or call APIs.
   - `PDG_AUTH_SESSION_SECRET` is optional, but recommended to add extra entropy to the session cookie.
   - `AI_KEY` should be the secret token for your AI service.
   - `AI_AUTOFILL_URL` must point to the POST endpoint that accepts `{ englishName }` and returns localized fields.
3. Apply database migrations and generate Prisma client:
   ```bash
   npm run db:migrate
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to use the tool. You will be redirected to `/login`; authenticate with the credentials from your `.env.local` to reach the catalog UI. The dashboard now supports:

- Search and filters across multilingual copy, categories, and tags.
- Autosave drafts every 800 ms with recovery banners if a newer draft exists.
- Inline validation that blocks banned Japanese words (`治る`, `治癒`, `効く`, `がん`, `糖尿病`, `高血圧`).
- Automatic bundle regeneration and SHA-256 ETag updates after each save or import.
- NDJSON paste-to-import workflow at `/import` (valid rows commit in a single transaction).
- Streaming bundle access via `/bundle/latest` which redirects to `public/bundle/latest.json.gz`.

## Environment Variables

Only the following server-side variables are required:

| Variable                | Description                                                                 |
| ----------------------- | --------------------------------------------------------------------------- |
| `PDG_AUTH_USERNAME`     | Username or email used on the login form.                                  |
| `PDG_AUTH_PASSWORD`     | Password required to sign in.                                               |
| `PDG_AUTH_SESSION_SECRET` | Optional extra entropy for the session cookie HMAC.                       |
| `AI_KEY`                | Secret key used to authenticate with the AI autofill service.               |
| `AI_AUTOFILL_URL`       | HTTPS endpoint that returns multilingual product descriptions.              |
| `DATABASE_URL`          | Prisma connection string (defaults to `file:./prisma/dev.db`).              |

> Note: Never expose these values to the client or commit them to version control.

## Available Scripts

- `npm run dev` – Start the development server with hot reload.
- `npm run build` – Create an optimized production build.
- `npm run start` – Start the production server after building.
- `npm run lint` – Run ESLint on the project.
- `npm run db:migrate` – Apply pending Prisma migrations (use after schema changes).
- `npm run schema:json` – Regenerate the JSON Schema artifact at `packages/schema/schema.json`.

## Deployment

This project can be deployed to any platform that supports Next.js 16 (App Router). Ensure the required environment variables are configured (including `DATABASE_URL`) and run database migrations (`npm run db:migrate`) before serving traffic.

## Manual Verification

1. Start dev server with `npm run dev` and sign in.
2. Create a product; confirm banned JP copy shows inline errors and that saving clears the draft.
3. Observe `/bundle/latest` redirects and serves the latest gzip with updated ETag (check Network tab).
4. Paste NDJSON at `/import` with a mix of valid/invalid lines; verify counts, error reporting, and refreshed products on dashboard search.
