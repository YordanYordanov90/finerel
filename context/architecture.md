# Architecture Context

## Stack


| Layer         | Technology                           | Role                                                       |
| ------------- | ------------------------------------ | ---------------------------------------------------------- |
| Framework     | Next.js 16 + TypeScript (App Router) | Dashboard UI, light API layer, demo/landing pages          |
| UI            | Tailwind CSS + shadcn/ui             | Component styling and layout                               |
| Graph UI      | React Flow                           | Interactive relationship graph visualization               |
| Auth          | Clerk                                | Multi-tenant authentication and user identity              |
| AI SDK        | Vercel AI SDK (`generateObject`)     | Structured relationship extraction                         |
| AI Model      | GPT-4.1-mini (OpenAI)                | `extract_relationships` tool — fast, cheap, Zod-native     |
| Agent Runtime | Vercel Functions (Fluid Compute)     | Cron handling, news fetch, extraction — no separate server |
| Database      | Neon Postgres + Drizzle ORM          | All structured data — relationships, briefings, watchlists |
| Scheduling    | Upstash QStash                       | Daily cron trigger → Vercel API route (with retries)       |
| Caching       | Upstash Redis                        | Fast lookups, optional deduplication layer                 |
| News Source   | Finnhub API (free tier)              | Watchlist news — swappable when usage justifies upgrade    |
| Email         | Resend                               | Morning briefing email delivery                            |
| Deployment    | Vercel (everything)                  | Single platform — dashboard, API routes, and cron agent    |


## System Boundaries

- `app/api/cron/` — Vercel API routes for QStash-triggered cron jobs. Owns the morning briefing pipeline: news fetching, relationship extraction, email delivery, and persistence writes. Never accessed directly by users.
- `lib/agent/` — Agent infrastructure: QStash verification helper, env validation, and agent tool implementations.
- `app/` — Next.js App Router pages. Owns all user-facing UI: dashboard, landing page, demo mode, settings, auth flows.
- `app/api/` — Next.js API routes. Owns read operations, dashboard data queries, Clerk webhook handling, and cron endpoints.
- `lib/db/` — Drizzle ORM schema, migrations, and query helpers. Shared across all routes.
- `lib/schemas/` — Zod schemas for all tool inputs/outputs and API boundaries. Single source of truth for data shapes.
- `components/` — Shared React components. `components/ui/` is shadcn-generated — do not hand-edit.

## Storage Model

- **Neon Postgres**: All structured application data — users, watchlists, companies, news items, relationships, briefings.
- **Upstash Redis**: Fast caching for repeated ticker lookups and optional deduplication of already-processed news items.
- **No blob/file storage**: No large binary assets in MVP. All content is structured text stored in Postgres.

## Auth and Access Model

- Every user authenticates via Clerk. `userId` from Clerk is the foreign key scoping all user data.
- Every database entity (`Watchlist`, `NewsItem`, `Relationship`, `Briefing`) has a `userId` column — no cross-user data access is possible at the query level.
- Demo mode: a pre-seeded read-only Clerk account with fixed `userId`. Dashboard detects demo mode via a flag and disables all mutation operations.
- Cron API routes authenticate QStash requests by verifying the `Upstash-Signature` header using `@upstash/qstash` `Receiver` before executing any work.
- OpenAI API key is a platform-level secret stored in Vercel environment variables — never exposed to the client or logged.

## Data Flow — Morning Briefing

```
QStash (09:00 EEST cron)
  → POST /api/cron/morning-briefing (Vercel)
      → Verify QStash signature
      → fetch_watchlist_news (Finnhub, per user)
      → extract_relationships (Vercel AI SDK + GPT-4.1-mini + Zod)
      → store_relationships (Drizzle → Neon Postgres)
      → generate_briefing_summary
      → send email via Resend
```

## Relationship Graph Model

- Stored as flat relational tables — no graph database.
- `companies` table: canonical name + ticker aliases for entity normalization.
- `relationships` table: directed edges with `source_company_id`, `target_company_id`, `relation_type`, `confidence`, `impact_level`, `context_snippet`, `source_news_id`, `extracted_at`, `user_id`.
- React Flow reads nodes + edges via a single API query. Graph complexity at 10–15 tickers over months is well within Postgres range.

## Invariants

1. The cron API routes (`app/api/cron/`) are the only routes that write relationships and briefings to the database. Other API routes are read-only for these entities.
2. Every database query filters by `userId` — no query ever returns data across users.
3. The OpenAI API key is never sent to the client, logged, or included in any response body.

3a. The Resend API key is server-side only, never exposed to the client.
4. QStash signature verification must pass before any cron handler executes any work — reject unsigned requests with 401 immediately.
5. `extract_relationships` output is always validated through a Zod schema before being written to the database — no raw LLM output is persisted.
6. Demo mode (`isDemoUser`) disables all mutation endpoints — read queries only.
7. `components/ui/` files are never hand-edited — use the shadcn CLI to add or update components.
8. AI extraction work runs in the cron API route with `maxDuration` configured as needed — Vercel Fluid Compute handles the execution.