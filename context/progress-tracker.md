# Progress Tracker

Update this file after every meaningful implementation change.

## Feature Implementation Status

| # | Feature | Status |
|---|---------|--------|
| 01 | [Drizzle Schema & Neon Connection](features/01-drizzle-schema.md) | ✅ Done |
| 02 | [Agent Scaffold (Vercel)](features/02-agent-scaffold.md) | ✅ Done |
| 03 | [Fetch Watchlist News Tool](features/03-fetch-news-tool.md) | ✅ Done |
| 04 | [Extract Relationships Tool](features/04-extract-relationships.md) | ✅ Done |
| 05 | [Store Relationships & Email Delivery](features/05-store-and-push.md) | ✅ Done |
| 06 | [API Routes: Watchlist](features/06-api-routes-watchlist.md) | ✅ Done |
| 07 | [API Routes: Read-Only Data](features/07-api-routes-read.md) | ✅ Done |
| 08 | [API Routes: Settings](features/08-api-routes-settings.md) | ⬜ Pending |
| 09 | [Clerk Authentication & Demo Mode](features/09-auth.md) | ⬜ Pending |
| 10 | [App Shell (Sidebar, Navbar, Layout)](features/10-app-shell.md) | ⬜ Pending |
| 11 | [Overview Page](features/11-overview-page.md) | ⬜ Pending |
| 12 | [Relationship Graph Page](features/12-graph-page.md) | ⬜ Pending |
| 13 | [Briefing History Page](features/13-briefing-history-page.md) | ⬜ Pending |
| 14 | [Watchlist Page](features/14-watchlist-page.md) | ⬜ Pending |
| 15 | [Settings Page](features/15-settings-page.md) | ⬜ Pending |
| 16 | [Landing Page](features/16-landing-page.md) | ⬜ Pending |
| 17 | [Demo Data Seeding](features/17-demo-seeding.md) | ⬜ Pending |

**Progress: 7 / 17 features complete**

---

## Current Phase

Phase 1 — Foundation (In Progress)

## Current Goal

Complete Clerk auth (feature 09) and settings API routes (feature 08).

## Completed

- Specification v1.0 (`financial-researcher-agent.md`) — finalized.
- Architecture and all six context files — populated from grill session (June 11, 2026).
- **Drizzle schema & Neon connection** (June 14, 2026):
  - `lib/db/schema.ts` — all six tables (`users`, `watchlists`, `companies`, `news_items`, `relationships`, `briefings`) with five indexes.
  - `lib/db/index.ts` — typed `db` export via `@neondatabase/serverless` + `drizzle-orm/neon-serverless`.
  - `drizzle.config.ts` — loads `DATABASE_URL` from `.env.local`.
  - First migration: `lib/db/migrations/0000_odd_puma.sql` — applied to Neon (June 14, 2026). All 6 tables + 5 indexes verified.
  - npm scripts: `db:generate`, `db:migrate`.
  - `.env.local` placeholder created (gitignored via `.env*`).
- **Agent scaffold** (June 14, 2026):
  - `lib/agent/env.ts` — Zod-validated env (6 required vars, throws on missing).
  - `lib/agent/verify-qstash.ts` — QStash `Receiver` signature verification helper.
  - `GET /api/health` — returns `{ status: 'ok', timestamp }`.
  - `POST /api/cron/morning-briefing` — QStash-protected stub, returns `{ ok: true }`.
  - Dependencies: `zod`, `@upstash/qstash`.
- **`fetch_watchlist_news` tool** (June 14, 2026):
  - `lib/schemas/news.ts` — `newsItemSchema`, `fetchNewsInputSchema`, Finnhub response validation.
  - `lib/agent/tools/fetch-watchlist-news.ts` — Finnhub company news fetch, URL-hash dedup, `news_items` persistence.
  - Endpoint: `GET https://finnhub.io/api/v1/company-news?symbol={ticker}&from={date}&to={date}`.
  - Rate limit: free tier 60 calls/min (not hit during testing; sequential per-ticker fetch).
- **`extract_relationships` tool** (June 22, 2026):
  - `lib/schemas/relationships.ts` — all input/output Zod schemas (`extractionInputSchema`, `extractionOutputSchema`, `extractedRelationshipSchema`, `relationTypeSchema`, `impactLevelSchema`); re-exports `newsItemSchema` from `lib/schemas/news.ts`.
  - `lib/agent/tools/extract-relationships.ts` — Vercel AI SDK `generateObject` with `openai('gpt-4.1-mini')`, verbatim system prompt from `core-intelligence-spec.md` §3, `buildExtractionPrompt` helper.
  - Security: `userId` and per-relationship `extractedAt` always set by tool, never trusted from model; `itemsProcessed` derived from input batch size.
  - Error handling: failures caught internally, logged with `userId` + `itemCount`, returns empty-relationships fallback (does not throw to caller).
  - Dependencies added: `ai`, `@ai-sdk/openai`.
- **Store relationships, email delivery & full cron pipeline** (June 22, 2026):
  - `lib/agent/tools/store-relationships.ts` — validates `extractionOutputSchema`, inserts `briefings` record, links `relationships` via `briefingId`, all scoped by `userId`.
  - `lib/agent/tools/send-briefing-email.ts` — Resend plain-text email, user lookup from `users` table, subject `FinRel Morning Briefing — <date>`, from `briefing@finrel.dev` (override via `RESEND_FROM_EMAIL`).
  - `lib/agent/process-user-briefing.ts` — per-user orchestration with isolated try/catch per step (fetch → extract → store → email).
  - `app/api/cron/morning-briefing/route.ts` — full pipeline: QStash verify → query users with watchlists → process each user → return 200. `maxDuration = 300`.
  - Dependencies added: `resend`.
  - Build passes. Live end-to-end run pending: seeded user + watchlist + Resend domain verification.
- **Watchlist API routes** (June 22, 2026):
  - `lib/schemas/watchlist.ts` — `addWatchlistTickerSchema`, response types.
  - `GET /api/watchlist` — list user tickers ordered by `addedAt DESC`.
  - `POST /api/watchlist` — add ticker (Zod validation, duplicate check, `201`).
  - `DELETE /api/watchlist/[ticker]` — ownership-scoped delete.
  - `lib/auth.ts` — `isDemoUser()` helper; demo user blocked from POST/DELETE (`403`).
  - Minimal Clerk setup added as dependency: `@clerk/nextjs`, `ClerkProvider` in layout, `middleware.ts` with public routes (`/`, `/demo`, `/api/health`, `/api/webhooks/clerk`, `/api/cron/*`).
  - All routes return `{ data }` / `{ error }` envelope; `userId` from `auth()` only.
- **Read-only API routes** (June 23, 2026):
  - `lib/schemas/api-params.ts` — `relationshipsQuerySchema` (ticker, relationType, minConfidence, date range, pagination), `briefingsQuerySchema` (pagination). Uses `z.coerce` for numeric query params.
  - `GET /api/relationships` — all optional filters; ticker matches `sourceTicker` OR `targetTicker`; parallel count query for `total`; ordered by `extractedAt DESC`.
  - `GET /api/briefings` — paginated briefing history sorted by `briefingDate DESC`; returns `id`, `summary`, `itemsProcessed`, `relationshipsFound`, `briefingDate`, `createdAt`.
  - `GET /api/graph` — returns `{ nodes, edges }` for React Flow. Nodes are deduplicated companies with `isWatchlist` flag from user's watchlist. Each relationship is a separate edge with `relationType`, `confidence`, `impactLevel`, `contextSnippet`, `sourceUrl`.
  - All routes: auth-gated (`401`), `userId`-scoped queries, `{ data }` / `{ error }` envelope, strictly read-only (no INSERT/UPDATE/DELETE).

## In Progress

- None yet.

## Next Up

1. Complete Clerk auth: webhook, sign-in/sign-up pages — feature 09.
2. API routes: settings (feature 08).
3. Build dashboard pages: overview, relationship graph (React Flow), briefing history, watchlist management, settings — features 10–15.
4. Seed demo data and build demo mode (read-only Clerk account) — feature 17.
5. Build public landing page — feature 16.

## Open Questions

- ~~What is the exact Finnhub endpoint and rate limit behavior for watchlist news?~~ Resolved — `GET /api/v1/company-news`, free tier 60 calls/min. (June 14, 2026)
- ~~Should news items be deduplicated by URL hash before being sent to `extract_relationships`?~~ Resolved — yes. `news_items.rawContentHash` column + `idx_news_items_hash` index added in schema. (June 14, 2026)
- ~~What is the Railway project name and region for FinRel?~~ Resolved — no Railway needed, everything runs on Vercel.
- Resend domain verification needed before first email send.
- Dashboard UI theme — dark only or light/dark toggle? (Recommend dark only, consistent with the "calm technical research tool" feel from the spec.)
- Which Upstash Redis instance — shared with other projects or dedicated for FinRel? (Recommend dedicated to avoid key namespace collisions.)
- Model behavior on live news not yet observed — confidence distribution and edge cases to be noted after first end-to-end cron run.

## Architecture Decisions

- **Multi-tenant from day one, single user in production for Phase 1.** All entities scoped by `userId`. Cost: near zero. Benefit: no rearchitect when demo users or beta testers are added. (June 11, 2026)
- **Finnhub free tier as news source.** Provides `headline`, `summary`, `url`, `source`, `datetime` per ticker. Sufficient for MVP extraction. Swappable via environment variable. (June 11, 2026)
- **Platform API key (not BYOK) for Phase 1.** One OpenAI key in Vercel env, owner absorbs cost. BYOK is a defined upgrade path for when real users join. Set spending cap on OpenAI dashboard before any external user accesses the system. (June 11, 2026)
- **Vercel AI SDK everywhere.** `generateObject` + Zod for `extract_relationships`. Provider-agnostic — switching model is one line. (June 11, 2026)
- **GPT-4.1-mini for extraction.** Fast, cheap, reliable structured outputs. Upgrade path to GPT-4.1 if precision suffers. (June 11, 2026)
- **~~QStash → Railway directly.~~** Superseded — see decision below. (June 11, 2026)
- **QStash → Vercel API route.** POST `/api/cron/morning-briefing`, QStash signature verified via `@upstash/qstash` `Receiver`. No separate server — runs as a Vercel Function with Fluid Compute. (June 13, 2026)
- **Neon Postgres + Drizzle only — no graph database.** Relationship graph stored as flat relational tables. React Flow reads nodes/edges from a single SQL query. Scale at 10–15 tickers is trivially handled by Postgres. (June 11, 2026)
- **~~Telegram is push-only — no interactive commands.~~** Superseded — see decision below. (June 11, 2026)
- **Telegram removed from MVP. Email via Resend replaces briefing push.** Reason: lower onboarding friction, no user setup required, agent complexity stays the same. Telegram with interactive chat moves to Phase 2. (June 13, 2026)
- **Demo mode via pre-seeded read-only Clerk account.** Fixed `userId`, read-only flag enforced server-side. Visitors see real relationship data without signing up. (June 11, 2026)
- **Separate OpenAI API key per project.** FinRel gets its own key isolated from cod3mate and PineForge — blast radius containment. (June 11, 2026)
- **camelCase SQL column names.** Drizzle schema uses camelCase column identifiers (e.g. `userId`, `sourceCompany`) to match Zod schemas in `core-intelligence-spec.md` — no mapping layer needed at insert time. (June 14, 2026)
- **Centralized model routing in `lib/models.ts`.** All AI model selections live in one file with named roles (`extraction`, `briefing`, `verification`). Tools import model references — never instantiate providers directly. Enables per-tool model experimentation and mixed-model agents (e.g. cheap model for extraction, smarter model for verification/auditing). (June 23, 2026)

## Session Notes

- Read-only API routes implemented (June 23, 2026). `GET /api/relationships` (filtered + paginated), `GET /api/briefings` (paginated), `GET /api/graph` (React Flow nodes/edges with `isWatchlist` flag). Response shapes documented in Completed section for frontend reference.
- Watchlist API routes implemented (June 22, 2026). `GET/POST /api/watchlist`, `DELETE /api/watchlist/[ticker]`. Minimal Clerk middleware + `isDemoUser()` added; full auth (webhook, sign-in) still pending in feature 09.
- Full morning briefing pipeline wired (June 22, 2026). `fetch → extract → store → email` in `app/api/cron/morning-briefing/route.ts`. Build passes. Live run requires seeded user/watchlist and Resend domain verification.
- `extract_relationships` implemented (June 22, 2026). Schema file at `lib/schemas/relationships.ts`, tool at `lib/agent/tools/extract-relationships.ts`. Build passes. Live model behavior (confidence distribution, edge cases) pending first end-to-end cron run.
- Drizzle schema implemented (June 14, 2026). Migration `lib/db/migrations/0000_odd_puma.sql` applied to Neon — all tables and indexes verified.
- Agent scaffold implemented (June 14, 2026). Routes verified: `GET /api/health` → 200, unsigned cron → 401, signed cron → 200.
- `fetch_watchlist_news` implemented and tested (June 14, 2026). Single/multi-ticker fetch, Zod validation, dedup, and `userId`-scoped inserts verified against Neon.
- Context files created in one session from the grill interview (June 11, 2026).
- Root spec document: `financial-researcher-agent.md` — all implementation must align with it.
- cod3mate patterns to reuse: owner whitelist → replace with Clerk `userId` scoping; tool registry pattern; `/data` volume → replace with Neon Postgres.