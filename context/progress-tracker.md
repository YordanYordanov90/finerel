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
| 08 | [API Routes: Settings](features/08-api-routes-settings.md) | ✅ Done |
| 09 | [Clerk Authentication & Demo Mode](features/09-auth.md) | ✅ Done |
| 10 | [App Shell (Sidebar, Navbar, Layout)](features/10-app-shell.md) | ✅ Done |
| 11 | [Overview Page](features/11-overview-page.md) | ✅ Done |
| 12 | [Relationship Graph Page](features/12-graph-page.md) | ✅ Done |
| 13 | [Briefing History Page](features/13-briefing-history-page.md) | ✅ Done |
| 14 | [Watchlist Page](features/14-watchlist-page.md) | ✅ Done |
| 15 | [Settings Page](features/15-settings-page.md) | ✅ Done |
| 16 | [Landing Page](features/16-landing-page.md) | ✅ Done |
| 17 | [Demo Data Seeding](features/17-demo-seeding.md) | ✅ Done |
| 18 | [Loading States](features/18-loading-state.md) | ✅ Done |
| 19 | [Error Handling](features/19-error-handling.md) | ✅ Done |
| 20 | [Ticker Autocomplete](features/20-ticker-autocomplete.md) | ✅ Done |
| 21 | [Settings PATCH + Interactive Time Picker](features/21-settings-patch.md) | ✅ Done |
| 22 | [HTML Briefing Email](features/22-html-email.md) | ✅ Done |
| 23 | [News Feed Page](features/23-news-feed.md) | ✅ Done |

**Progress: 23 / 23 features complete**

---

## Current Phase

Phase 1 — Foundation + Production (Complete)

## Current Goal

Deployed to production (finerel.vercel.app). QStash schedule live (`0 3-19 * * *` UTC). Resend domain verification pending — currently limited to owner email only.

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
  - Minimal Clerk setup added as dependency: `@clerk/nextjs`, `ClerkProvider` in layout, `proxy.ts` with public routes (`/`, `/demo`, `/api/health`, `/api/webhooks/clerk`, `/api/cron/*`).
  - All routes return `{ data }` / `{ error }` envelope; `userId` from `auth()` only.
- **Read-only API routes** (June 23, 2026):
  - `lib/schemas/api-params.ts` — `relationshipsQuerySchema` (ticker, relationType, minConfidence, date range, pagination), `briefingsQuerySchema` (pagination). Uses `z.coerce` for numeric query params.
  - `GET /api/relationships` — all optional filters; ticker matches `sourceTicker` OR `targetTicker`; parallel count query for `total`; ordered by `extractedAt DESC`.
  - `GET /api/briefings` — paginated briefing history sorted by `briefingDate DESC`; returns `id`, `summary`, `itemsProcessed`, `relationshipsFound`, `briefingDate`, `createdAt`.
  - `GET /api/graph` — returns `{ nodes, edges }` for React Flow. Nodes are deduplicated companies with `isWatchlist` flag from user's watchlist. Each relationship is a separate edge with `relationType`, `confidence`, `impactLevel`, `contextSnippet`, `sourceUrl`.
  - All routes: auth-gated (`401`), `userId`-scoped queries, `{ data }` / `{ error }` envelope, strictly read-only (no INSERT/UPDATE/DELETE).
- **Settings API route** (June 23, 2026):
  - `GET /api/settings` — returns `{ data: { briefingTime: string } }` from `users` table, scoped by `userId`.
  - Read-only in MVP; demo user `GET` works normally (no mutations).
  - Auth-gated (`401`), `404` if user row missing, `{ data }` / `{ error }` envelope.
- **Clerk authentication & demo mode** (June 23, 2026):
  - Clerk app: `classic-manatee-95` (Clerk Dashboard instance slug).
  - `proxy.ts` — `clerkMiddleware` + `createRouteMatcher` public routes: `/`, `/demo`, `/api/health`, `/api/webhooks/clerk`, `/api/cron/*`, `/sign-in`, `/sign-up`. All other routes require auth (redirect to sign-in).
  - `lib/auth.ts` — `isDemoUser()` compares `userId` to `DEMO_USER_ID` env var.
  - `app/sign-in/[[...sign-in]]/page.tsx` + `app/sign-up/[[...sign-up]]/page.tsx` — Clerk hosted components.
  - `POST /api/webhooks/clerk` — Svix signature verification via `verifyWebhook`, Zod-validated `user.created` payload, inserts `users` row (empty watchlist by default), idempotent via `onConflictDoNothing`.
  - `lib/schemas/clerk-webhook.ts` — `clerkUserCreatedEventSchema`, `getPrimaryEmail()` helper.
  - Env vars: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SIGNING_SECRET`, `DEMO_USER_ID`, `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL`.
- **App shell** (June 23, 2026):
  - `app/(app)/layout.tsx` — authenticated dashboard shell via `AppShell`.
  - `components/AppShell.tsx` — mobile sidebar toggle + overlay.
  - `components/AppSidebar.tsx` — 240px sidebar, five nav links (Lucide `h-5 w-5`), active `text-cyan-400`, FinRel wordmark (Syne, `Fin` zinc-100 + `Rel` cyan-400).
  - `components/AppNavbar.tsx` — sticky `fr-nav`, breadcrumb page title, Clerk `UserButton`.
  - `app/globals.css` — all seven `fr-*` utilities per ui-context.md.
  - `app/layout.tsx` — Inter (`font-sans`), Syne (`font-heading`), Geist Mono (`font-mono`).
  - Placeholder pages: `/`, `/graph`, `/history`, `/watchlist`, `/settings` under `(app)` route group.
  - Overview relocated to `/overview`; landing page at `/` via `(landing)` route group.
- **Overview page** (June 23, 2026):
  - `app/(app)/page.tsx` — server component; Drizzle queries scoped by `userId` for today's relationships (confidence DESC) and today's briefing.
  - `components/relationships/RelationshipCard.tsx` — company arrow, ticker pills, `fr-badge` metadata, confidence semantic colors, context snippet, external link.
  - `components/briefing/BriefingSummaryCard.tsx` — summary (max 500 chars), `itemsProcessed` / `relationshipsFound` badges.
  - `components/EmptyState.tsx` — reusable empty state with Lucide `h-8 w-8` icon.
  - `lib/utils/confidence.ts` — percentage + label helper (High ≥0.8 cyan, Medium ≥0.5 amber, Low rose).
  - 2-column layout (`lg:grid-cols-3`, feed spans 2); full-page empty state when no data today.
- **Relationship graph page** (June 23, 2026):
  - `lib/data/graph.ts` — shared graph data fetch (used by page + `GET /api/graph`).
  - `lib/utils/graph.ts` — dagre layout, edge colors, stroke width scaling, formatters.
  - `components/graph/` — `RelationshipGraph`, `CompanyNode`, `RelationshipEdge`, `NodeDetailDrawer`, `GraphControls`.
  - `app/(app)/graph/page.tsx` — server component; empty state when no edges; full-width React Flow canvas.
  - Dependencies: `@xyflow/react`, `@dagrejs/dagre`. shadcn Sheet for node detail drawer.
  - Watchlist nodes: larger size + `border-cyan-500/50`. Edge labels on hover only. Confidence-scaled stroke width.
- **Briefing history page** (June 23, 2026):
  - `lib/schemas/history-filters.ts` — Zod-validated filter state (relationTypes, minConfidence, dateRange, ticker).
  - `lib/utils/history-api.ts` — client fetch helpers for briefings and expanded relationships.
  - `components/history/` — `FilterBar`, `BriefingTable`, `BriefingRow` (expandable rows + RelationshipCard).
  - `app/(app)/history/page.tsx` — auth-gated server wrapper.
  - `GET /api/relationships` extended with `briefingId` param for per-briefing expand.
  - Load-more pagination, date range filters briefings client-side; other filters apply on relationship expand.
- **Watchlist page** (June 23, 2026):
  - `lib/utils/watchlist-api.ts` — client fetch helpers for watchlist CRUD and relationship activity aggregation.
  - `components/watchlist/AddTickerInput.tsx` — uppercase input, Zod validation, toast errors, `POST /api/watchlist`.
  - `components/watchlist/TickerList.tsx` — ticker rows with relationship count + last activity, inline remove confirm, demo read-only banner.
  - `app/(app)/watchlist/page.tsx` — auth-gated server wrapper; `isDemoUser()` disables mutations.
  - shadcn `sonner` + `input` added; `Toaster` in root layout.
  - `addWatchlistTickerSchema` extended with letters-only regex.
- **Settings page** (June 23, 2026):
  - `components/settings/BriefingTimeSection.tsx` — read-only briefing time with beta note.
  - `app/(app)/settings/page.tsx` — email from Clerk `currentUser()`, `briefingTime` from DB, demo read-only banner.
- **Landing page** (June 23, 2026):
  - `app/(landing)/` — public marketing page at `/`; no app shell.
  - `components/landing/` — `LandingNavbar`, `Hero`, `RelationshipPreview`, `HowItWorks`, `Features`, `LandingCta`, `LandingFooter`.
  - `app/demo/page.tsx` — demo entry redirects to `/overview` (auth) or sign-in.
  - Dashboard overview moved from `/` to `/overview`; sidebar/navbar updated.
- **Demo data seeding** (June 23, 2026):
  - `scripts/seed-demo.ts` — idempotent delete-and-reseed via `npm run db:seed-demo`.
  - `scripts/seed-data/` — handcrafted news, briefings, relationships generators.
  - Seeds `DEMO_USER_ID` (or fallback `user_demo_finrel`): 5 tickers, 65 news items, 24 briefings, 60 relationships.
  - Confidence distribution 24/24/12 (high/medium/low); all five relation types represented.
- **Loading states** (June 23, 2026):
  - `components/ui/skeleton.tsx` — shadcn Skeleton with `bg-zinc-800/50` for dark theme.
  - `app/(app)/{overview,graph,history,watchlist,settings}/loading.tsx` — route-level skeletons mirroring each page layout.

## In Progress

- None.

## Next Up

1. Verify a custom domain in Resend to enable sending briefing emails to users other than the owner.
2. Per-user briefing time in the cron is respected — but `briefingTime` only supports full-hour values. Settings UI enforces this (dropdown, whole hours only).

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

- **Extraction outage fixed — emails were empty for days (June 26, 2026).** Diagnosis from prod DB: briefings showed `itemsProcessed=80–120, relationshipsFound=0` every run since ~June 25. Two compounding bugs, neither surfaced to the user (both swallowed by the fallback path):
  1. **OpenAI structured-output schema rejection.** `generateObject` was handed `extractionOutputSchema`, whose `sourceUrl: z.string().url()` compiles to `format: "uri"` (rejected by strict mode), and whose `.optional()` tickers violate strict mode's "every property in `required`" rule. So `generateObject` threw on *every* call — extraction had likely never produced a relationship in prod (demo data was seeded directly, masking it). Fix: added `extractionModelSchema` (strict-mode-clean: nullable tickers, plain-string URL, bounds as `.describe()` only) in `lib/schemas/relationships.ts`; `extract-relationships.ts` now calls `generateObject` with it and `applyToolOverrides` sanitizes back into `extractionOutputSchema` (null tickers→undefined, clamp confidence, truncate snippet/summary). Also relaxed canonical `sourceUrl` from `.url()` to `.string()` so the final parse can't throw on a malformed echo.
  2. **50-item input cap with no chunking.** `extractionInputSchema` caps `newsItems` at 50; the briefing passed all new items (80–120 once watchlists grew). The `.parse()` (outside the tool's try/catch) threw, caught in `process-user-briefing.ts` → empty fallback with `itemsProcessed` preserved. Fix: `process-user-briefing.ts` now chunks news into batches of 50 (`extractInBatches`), calls the tool per batch, and merges (`mergeExtractionOutputs`: concat relationships, sum itemsProcessed, summary from the batch with the most relationships).
  - Verified end-to-end against 50 real stored news items: 5 relationships extracted with a real summary. `tsc` clean. **Not yet deployed.**
- Quiet-day briefing email enriched (June 26, 2026). When extraction yields zero relationships, the email no longer collapses to a single "No new relationships found today." line — it now renders a **Today's watchlist headlines** section from the news items scanned that morning. `briefing-email-template.ts` gained `prepareHeadlines()` (dedup by headline + sort by `publishedAt` desc, max 8), `renderHeadline()`/`renderHeadlinesBlock()` (HTML cards: headline link, source, up to 4 cyan ticker pills) and a text equivalent. `buildBriefingHtml`/`buildBriefingText` take an optional `newsItems` param (defaults `[]`). `sendBriefingEmail(output, newsItems)` and `processUserBriefing` thread `fetchResult.newsItems` through. When there are no headlines either (genuinely empty fetch), the original fallback line is preserved. Busy-day email (relationships present) is unchanged.
- News feed implemented (June 25, 2026). `GET /api/news` returns stored news for user's watchlist tickers via `arrayOverlaps`; `?refresh=true` fetches fresh from Finnhub before reading back. `NewsFeed` client component: loads stored news instantly, fires background Finnhub refresh, manual Refresh button. `/news` + `/demo/news` pages. News added to sidebar nav.
- HTML briefing email implemented (June 25, 2026). `lib/agent/tools/briefing-email-template.ts` — `buildBriefingHtml()` renders FinRel-branded relationship cards (source → target, ticker pills in cyan mono, relation-type badge, color-coded impact, confidence %, context snippet, source link). `buildBriefingText()` plain-text fallback. `send-briefing-email.ts` now takes full `ExtractionOutput` and sends both `html` + `text`.
- Settings PATCH implemented (June 25, 2026). `PATCH /api/settings` validates `HH:MM` format, updates `briefingTime` in `users` table. `BriefingTimeSection` converted to client component with hourly dropdown (06:00–22:00 EEST) and Save button; disabled for demo users.
- Ticker autocomplete implemented (June 25, 2026). `lib/data/tickers.ts` — ~250 major US tickers with `searchTickers()` (exact symbol → prefix → name match ranking). `AddTickerInput` shows dropdown on type, keyboard-navigable (arrows/Enter/Escape), click-to-select. Ticker validation regex updated to allow dots (`BRK.B`).
- QStash cron updated to hourly (`0 3-19 * * *` UTC). Route now queries only users whose `briefingTime` matches current EEST hour (`currentEestHour()` helper). Per-user scheduling without managing per-user QStash schedules. Deployed and verified live (June 24, 2026).
- Foreign key fix: `POST /api/watchlist` now upserts the user into the `users` table before inserting the watchlist row. Resolves `watchlists_userId_users_id_fk` violation for users whose Clerk webhook was never delivered (June 24, 2026).
- Error handling — complete (June 23, 2026). Low priority: `MAX_PAGES` guard on `fetchAllRelationships`, Retry buttons on `TickerList`/`BriefingTable`/`BriefingRow`, demo-not-configured warning in `getAuthOrDemoUserId`.
- Error handling — medium priority (June 23, 2026). `parseResponse()` hardened in `watchlist-api.ts` + `history-api.ts`; `app/not-found.tsx` themed 404; Clerk webhook DB insert wrapped in try/catch.
- Error handling — high priority (June 23, 2026). `app/(app)/error.tsx` + `app/global-error.tsx` boundaries; try/catch on all six API routes (`briefings`, `relationships`, `graph`, `watchlist`, `watchlist/[ticker]`, `settings`) with structured 500 responses and route-prefixed logging.
- Loading states implemented (June 23, 2026). Skeleton component + five `loading.tsx` files for all dashboard routes.
- Demo data seeding implemented (June 23, 2026). `npm run db:seed-demo` seeds 60 relationships, 24 briefings, 5-ticker watchlist. Phase 1 complete.
- Landing page implemented (June 23, 2026). Public `/` marketing page, demo CTA, overview at `/overview`.
- Settings page implemented (June 23, 2026). Clerk email + DB briefing time, read-only MVP, demo banner.
- Watchlist page implemented (June 23, 2026). Add/remove tickers with toast feedback, activity summaries from relationships API, demo read-only mode.
- Briefing history page implemented (June 23, 2026). Filter bar, expandable briefing rows, RelationshipCard on expand, load-more pagination, `briefingId` filter on relationships API.
- Relationship graph page implemented (June 23, 2026). React Flow canvas with dagre layout, type-colored edges, hover labels, watchlist node styling, shadcn Sheet drawer on node click.
- Overview page implemented (June 23, 2026). Relationship feed + briefing summary card, confidence colors, empty state, Drizzle server-side fetch.
- App shell implemented (June 23, 2026). Sidebar, navbar, `fr-*` utilities, three fonts, responsive mobile nav. Placeholder pages for all five dashboard routes.
- Clerk auth implemented (June 23, 2026). Webhook onboarding, sign-in/sign-up pages, `proxy.ts` public route list, `isDemoUser()` helper. Set `CLERK_WEBHOOK_SIGNING_SECRET` and `DEMO_USER_ID` in Vercel before going live.
- Settings API route implemented (June 23, 2026). `GET /api/settings` returns user `briefingTime`; read-only, demo-friendly.
- Read-only API routes implemented (June 23, 2026). `GET /api/relationships` (filtered + paginated), `GET /api/briefings` (paginated), `GET /api/graph` (React Flow nodes/edges with `isWatchlist` flag). Response shapes documented in Completed section for frontend reference.
- Watchlist API routes implemented (June 22, 2026). `GET/POST /api/watchlist`, `DELETE /api/watchlist/[ticker]`. Minimal Clerk proxy + `isDemoUser()` added; full auth (webhook, sign-in) still pending in feature 09.
- Full morning briefing pipeline wired (June 22, 2026). `fetch → extract → store → email` in `app/api/cron/morning-briefing/route.ts`. Build passes. Live run requires seeded user/watchlist and Resend domain verification.
- `extract_relationships` implemented (June 22, 2026). Schema file at `lib/schemas/relationships.ts`, tool at `lib/agent/tools/extract-relationships.ts`. Build passes. Live model behavior (confidence distribution, edge cases) pending first end-to-end cron run.
- Drizzle schema implemented (June 14, 2026). Migration `lib/db/migrations/0000_odd_puma.sql` applied to Neon — all tables and indexes verified.
- Agent scaffold implemented (June 14, 2026). Routes verified: `GET /api/health` → 200, unsigned cron → 401, signed cron → 200.
- `fetch_watchlist_news` implemented and tested (June 14, 2026). Single/multi-ticker fetch, Zod validation, dedup, and `userId`-scoped inserts verified against Neon.
- Context files created in one session from the grill interview (June 11, 2026).
- Root spec document: `financial-researcher-agent.md` — all implementation must align with it.
- cod3mate patterns to reuse: owner whitelist → replace with Clerk `userId` scoping; tool registry pattern; `/data` volume → replace with Neon Postgres.