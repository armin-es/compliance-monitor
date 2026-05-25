# Compliance Monitor

A production-quality Compliance Monitor that evaluates actions against process standards using the `facebook/bart-large-mnli` Zero-Shot NLI model. Results are stored in a per-user compliance log as COMPLIES, DEVIATES, or NO STANDARD.

---

## What This Demonstrates

The core detection loop: an action is observed, measured against a standard, and the result is logged. The architecture treats it accordingly, as a foundation that could scale into a multi-tenant production system.

| Signal | Implementation |
| --- | --- |
| Authentication | Clerk: middleware protection, session-aware SSR, ownership checks on mutations |
| Layered architecture | Route / Service / Repository: each layer has one responsibility |
| Real persistence | Prisma 7 + SQLite (dev) / Postgres (prod swap via one env var) |
| Type safety end-to-end | Zod schemas, TypeScript types, Prisma types: no `any` |
| Server/Client boundary | `page.tsx` is a Server Component; interactive state in `ComplianceMonitor` |
| Server state | TanStack Query v5: `useMutation` + `useQuery`, not `useState` + raw fetch |
| SSR initial data | No loading flash: data fetched server-side and passed as `initialData` |
| Rate limiting | `POST /api/analyze` rate-limited per user via Upstash Redis |
| Soft delete | Records are never hard-deleted: auditable, append-only history |
| HF edge cases | Cold start retry (2s / 4s / 8s), 45s timeout, typed error classification |
| Domain language | UI speaks compliance domain vocabulary throughout |
| Component library | shadcn/ui throughout |
| E2E coverage | Playwright + `@clerk/testing`: 5 authenticated user flows |

---

## Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript 5 (strict)
- **Auth:** Clerk
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Server state:** TanStack Query v5
- **Database:** Prisma 7 + SQLite (dev) / Postgres (prod)
- **Validation:** Zod v4
- **Rate limiting:** @upstash/ratelimit (optional in dev)
- **Testing:** Playwright + @clerk/testing

---

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd compliance-monitor
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

| Variable | How to get it |
| --- | --- |
| `HUGGINGFACE_API_TOKEN` | Create a free account at [huggingface.co](https://huggingface.co), then go to Profile → Settings → Access Tokens → New token (Read) |
| `DATABASE_URL` | Leave as `file:./dev.db` for local SQLite |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Create a project at [clerk.com](https://clerk.com) → API Keys |
| `CLERK_SECRET_KEY` | Same Clerk project → API Keys |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Set to `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Set to `/sign-up` |
| `UPSTASH_REDIS_REST_URL` | Optional: leave blank to skip rate limiting in dev |
| `UPSTASH_REDIS_REST_TOKEN` | Optional: leave blank to skip rate limiting in dev |

### 3. Database setup

```bash
npx prisma migrate dev
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up for an account and start running compliance checks.

---

## Seed the database (optional)

To pre-populate four example compliance checks:

1. Sign up in the app and open your browser's dev console
2. Run `Clerk.user.id` to get your Clerk `userId`
3. Add it to `.env.local`: `SEED_USER_ID=user_xxxx`
4. Run the seed:

```bash
npm run db:seed
```

This calls the HuggingFace API live and stores all four results with real confidence scores.

---

## Running Tests

### Playwright E2E

The Playwright tests use `@clerk/testing` to inject authenticated sessions without going through the sign-in UI. The tests call the real HuggingFace API, so allow up to 60 seconds per test for model inference.

**Requirements for running E2E tests:**

- `.env.local` must be configured (Clerk keys + HuggingFace token)
- Clerk instance must be a development instance (not production)

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Open Playwright UI for interactive debugging
npm run test:e2e:ui
```

**Test coverage:**

| Test | Flow |
| --- | --- |
| Compliant action → COMPLIES | Open dialog → fill form → submit → assert badge → close → assert log entry |
| Deviating action → DEVIATES | Open dialog → fill form → submit → assert badge → close → assert log entry |
| Persistence across reload | Open dialog → submit → reload → assert log entry survives |
| Edit and resubmit | Submit → close → edit → resubmit → assert updated result |
| Soft delete | Submit → close → delete → confirm → assert removed → assert survives reload |

---

## Project Structure

```text
compliance-monitor/
├── app/
│   ├── (auth)/sign-in, sign-up    # Clerk auth pages
│   ├── (app)/page.tsx             # Server Component: SSR + auth
│   ├── api/analyze/route.ts       # POST: create analysis
│   ├── api/analyses/route.ts      # GET: list analyses
│   ├── api/analyses/[id]/route.ts # PATCH + DELETE
│   └── providers.tsx              # QueryClientProvider
├── components/
│   ├── ui/                        # shadcn/ui primitives
│   ├── compliance-monitor.tsx     # "use client" orchestrator
│   ├── check-dialog.tsx           # Run / edit dialog with inline result
│   ├── analysis-form.tsx
│   ├── result-panel.tsx
│   ├── history-list.tsx
│   └── history-item.tsx
├── server/                        # server-only
│   ├── db.ts                      # Prisma client singleton
│   ├── services/analysis.ts       # HuggingFace + orchestration
│   └── repositories/analysis.ts  # All DB access, userId-filtered
├── hooks/                         # TanStack Query hooks
├── lib/                           # validations, env, utils
├── types/                         # Shared TypeScript types
├── e2e/                           # Playwright tests
└── prisma/                        # Schema + migrations + seed
```

---

## API

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/analyze` | Yes | Run compliance check (rate-limited) |
| `GET` | `/api/analyses` | Yes | List user's active analyses |
| `PATCH` | `/api/analyses/:id` | Yes | Edit + resubmit (ownership verified) |
| `DELETE` | `/api/analyses/:id` | Yes | Soft-delete (ownership verified) |
