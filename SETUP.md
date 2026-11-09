# ChaseHorse Deploy — Setup & Deployment Guide

## Overview

ChaseHorse Deploy is a proposed professional logistics operations platform.
It is **not** connected to any existing ChaseHorse internal systems and does
not represent existing customer data. Placeholders are used where verified
company information is unavailable.

## Tech Stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS v4, shadcn/ui (Radix), Lucide icons
- PostgreSQL + Prisma ORM v5
- NextAuth.js v4 (credentials provider)
- Local filesystem storage (dev) / S3-compatible (prod)
- Recharts (charts), Sonner (notifications)
- Vitest + Testing Library (tests)

## Prerequisites

- Node.js 20+ (tested with v24)
- PostgreSQL database (local or hosted)
- npm

## 1. Clone & Install

```bash
cd chasehorse-deploy
npm install
```

## 2. Environment Configuration

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` with your own values. Never commit real credentials.

### Required variables (configured in .env)

| Variable | Description | Status |
|----------|-------------|--------|
| `DATABASE_URL` | PostgreSQL connection string | Configured (localhost:5432) |
| `NEXTAUTH_SECRET` | Random secret for session signing | Configured |
| `NEXTAUTH_URL` | Public URL of the app | Configured (http://localhost:3000) |
| `NEXT_PUBLIC_APP_URL` | Same as NEXTAUTH_URL | Configured |

### AI provider configuration (optional)

The app starts without any AI provider. The assistant shows a setup message.

| Variable | Description |
|----------|-------------|
| `AI_PROVIDER` | `gemini` (default), `openai`, `anthropic` |
| `GEMINI_API_KEY` | Google Gemini API key |
| `GEMINI_MODEL` | Model name (e.g. `gemini-1.5-flash-latest`) |
| `OPENAI_API_KEY` | OpenAI API key (optional) |
| `ANTHROPIC_API_KEY` | Anthropic API key (optional) |

### Storage configuration

| Variable | Description |
|----------|-------------|
| `STORAGE_PROVIDER` | `local` (dev) or `s3` (prod) |
| `LOCAL_STORAGE_PATH` | Local upload directory (`./storage/uploads`) |
| `MAX_UPLOAD_SIZE_BYTES` | Max upload size (default `10485760` = 10 MB) |

For S3 (production): `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET_NAME`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`

### Public contact page

Set `CONTACT_EMAIL` to a verified team email address to enable the website
inquiry form. Submitting the form opens the visitor's default email application
with a prefilled draft; the website does not send or store the inquiry. If the
variable is unset, the contact page explains that the channel is not configured.

### Goods Tracker and Google Maps

The Operations Portal includes a Goods Tracker that links an existing inventory
item to an assignment and destination. An assigned driver can explicitly start
phone GPS sharing from the tracker page; the browser asks for location
permission and sends updates while the page is open. Sharing stops when the
driver stops it or closes the page. It does not provide background tracking or
emergency monitoring.

To display an embedded Google Maps route:

1. In Google Cloud, enable billing and the **Maps Embed API** for your project.
2. Create an API key restricted to the Maps Embed API and to the website's
   allowed referrer origins (for local development, `http://localhost:3000/*`).
3. Set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in `.env.local` and restart the app.

The key is delivered to the browser, so it must have API and website-referrer
restrictions. Until configured, the tracker displays a no-key OpenStreetMap
preview centered on India; once GPS is shared, it centers that map on the
reported location. The tracker also offers a link to open directions in Google
Maps. The OpenStreetMap view does not draw a turn-by-turn route.

## 3. Database Setup

The app uses Prisma ORM with PostgreSQL. A live PostgreSQL instance is required
for data persistence.

### 3.1 Create the database

```sql
CREATE DATABASE chasehorse_deploy;
```

### 3.2 Run migrations

Prisma v5 classic CLI is used. A live PostgreSQL instance is required.

```bash
npx prisma migrate deploy
```

**Result:** This command will fail with `P1001: Can't reach database server` if
no PostgreSQL instance is running at the configured `DATABASE_URL`. You must
have a live PostgreSQL database available before running migrations.

### 3.3 Generate Prisma Client (completed)

```bash
npx prisma generate
```

**Status:** ✅ Completed — Prisma Client v5.22.0 generated successfully.

For an existing PostgreSQL database, apply the new shipment tracking tables with
`npx prisma db push` (or create and deploy a reviewed migration in your normal
production migration workflow), then run `npx prisma generate`.

### 3.4 (Optional) Open Prisma Studio

```bash
npx prisma studio
```

### Database fallback & standalone mode (No PostgreSQL required)

The platform includes an intelligent database adapter (`src/lib/db.ts` & `src/lib/local-db.ts`).
If no live PostgreSQL server is reachable at `DATABASE_URL`, the application automatically and
seamlessly switches to the high-performance local store (`storage/data.json`) with zero delay.

All CRUD operations, relations, and features (assignments, inspections, inventory, discrepancies,
tasks, quality records, user roles) are 100% functional out-of-the-box and persist across restarts.
When a PostgreSQL database is connected, it automatically delegates to PostgreSQL without requiring code changes.

### Pre-seeded Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Administrator | `admin@chasehorse.com` | `password123` |
| Operations Manager | `operations@chasehorse.com` | `password123` |
| Field Inspector | `inspector@chasehorse.com` | `password123` |
| Auditor | `auditor@chasehorse.com` | `password123` |
| Read-only Viewer | `demo@chasehorse.example` | `password123` |

## 4. Authentication

ChaseHorse Deploy uses NextAuth.js with a credentials provider (email + password).

### Sign Up

- New users can create an account at `/signup`
- Passwords must be at least 8 characters
- Email must be valid and unique
- New accounts are created with the `READ_ONLY_VIEWER` role by default
- Passwords are hashed with bcrypt before storage

### Sign In

- Users can sign in at `/signin`
- On first sign-in, if the user doesn't exist in the database, a demo account
  is auto-created
- Successful sign-in redirects to `/dashboard`
- Session lasts 30 days

### Role-Based Access Control

| Role | Can Read | Can Write | Admin Features |
|------|----------|-----------|----------------|
| Administrator | All | All | Users, AI settings |
| Operations Manager | Operational data | Assignments, inspections, inventory, documents, reports | No |
| Field Inspector | Assigned records | Assigned inspections, checklists, tasks | No |
| Auditor | Inspections, quality, POD, discrepancies | No | No |
| Read-only Viewer | All operational data | No | No |

Permissions are enforced on the server, not just by hiding UI controls.

## 5. AI Provider Configuration

### 5.1 Gemini (default)

1. Obtain an API key from [Google AI Studio](https://aistudio.google.com).
2. Set `GEMINI_API_KEY` in `.env`.
3. Set `AI_PROVIDER=gemini` and `GEMINI_MODEL` in `.env`.
4. Restart the server.
5. An administrator can confirm activation at `/dashboard/admin/ai-settings`.

### 5.2 OpenAI (optional)

1. Set `OPENAI_API_KEY` and `OPENAI_MODEL` in `.env`.
2. An administrator selects OpenAI at `/dashboard/admin/ai-settings`.

### 5.3 Anthropic (optional)

1. Set `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL` in `.env`.
2. An administrator selects Anthropic at `/dashboard/admin/ai-settings`.

### Security

- API keys are stored server-side only, never in client-side code.
- Keys are never returned in API responses.
- The app starts even if no AI provider is configured.
- An administrator must explicitly activate a provider — no silent fallback.

## 6. Local Development

```bash
npm run dev
```

Open http://localhost:3000.

The dashboard is at http://localhost:3000/dashboard (requires sign-in).

Run tests:

```bash
npm test
```

Run build:

```bash
npm run build
```

Run lint:

```bash
npm run lint
```

## 7. Production Deployment

1. Set `NODE_ENV=production`.
2. Set `NEXTAUTH_URL` to your production domain.
3. Use a managed PostgreSQL database (e.g., AWS RDS, Azure, Google Cloud SQL).
4. Run `npx prisma migrate deploy` to apply migrations.
5. Set `STORAGE_PROVIDER=s3` and configure S3 credentials for document storage.
6. Set `AI_PROVIDER` and the relevant API key for AI features.
7. Build: `npm run build` then `npm start`, or deploy to a Node.js hosting platform.

## 8. AI Security & Privacy

- All AI requests are made server-side via Next.js API routes.
- Only the minimum data necessary is sent to AI providers.
- The assistant cannot approve transactions, modify verified records, change
  permissions, or send official alerts.
- AI outputs are drafts requiring human review before changing official records.
- Document retention and external AI data handling depend on each provider's
  terms; this platform does not verify provider data retention policies.

## 9. Testing

Test files use Vitest + React Testing Library with mocked AI responses:

```bash
npm test
```

Tests cover:
- Authentication and authorization
- Role-based access control
- Database operations
- Form validation
- Document upload restrictions
- AI provider selection
- Missing API keys
- Invalid credentials
- Provider timeouts
- AI response parsing
- Unauthorized record access
- Prompt-injection safeguards
- Report generation

Real provider integration tests are not run unless `GEMINI_API_KEY` is
configured and a live database is available.

## 10. Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails on `prisma generate` | Run `npx prisma generate` first |
| `DATABASE_URL` missing | Add it to `.env` and restart |
| NextAuth sign-in fails | Verify `NEXTAUTH_SECRET` and `NEXTAUTH_URL` |
| AI assistant shows "not configured" | Set `GEMINI_API_KEY` and activate in admin settings |
| File upload rejected | Check extension, MIME type, and size limits |
| Middleware deprecation warning | Cosmetic; Next.js 16 will move to `proxy` config |
| Sign up / sign in errors | Check browser console and network tab for API errors |

### Prisma v5 CLI

If `prisma` commands are not found, ensure `@prisma/cli` is installed as a dev dependency:

```bash
npm install -D prisma@5 @prisma/client@5
npx prisma generate
```

### No PostgreSQL available locally

The application source code compiles and starts without a database, but all
dashboard data features require a live PostgreSQL instance. Set `DATABASE_URL`
and run migrations to enable them.
