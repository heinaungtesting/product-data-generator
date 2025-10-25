## Product Data Generator

This project bundles a Product Data Generator built with Next.js App Router, TypeScript, and Tailwind CSS. It lets you author catalog entries, enrich multilingual copy via AI, validate against a shared Zod schema, and export an import-ready JSON file.

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
3. Start the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to use the tool. You will be redirected to `/login`; authenticate with the credentials from your `.env.local` to reach the catalog UI. The interface supports manual entry, CSV import, and AI autofill. Use the **Download JSON** button to validate and export `catalog-import.json`.

## Environment Variables

Only the following server-side variables are required:

| Variable                | Description                                                                 |
| ----------------------- | --------------------------------------------------------------------------- |
| `PDG_AUTH_USERNAME`     | Username or email used on the login form.                                  |
| `PDG_AUTH_PASSWORD`     | Password required to sign in.                                               |
| `PDG_AUTH_SESSION_SECRET` | Optional extra entropy for the session cookie HMAC.                       |
| `AI_KEY`                | Secret key used to authenticate with the AI autofill service.               |
| `AI_AUTOFILL_URL`       | HTTPS endpoint that returns multilingual product descriptions.              |

> Note: Never expose these values to the client or commit them to version control.

## Available Scripts

- `npm run dev` – Start the development server with hot reload.
- `npm run build` – Create an optimized production build.
- `npm run start` – Start the production server after building.
- `npm run lint` – Run ESLint on the project.

## Deployment

This project can be deployed to any platform that supports Next.js 16 (App Router). Ensure the required environment variables are configured in your hosting provider before deploying.
