# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

Phase 1 — Foundation (In Progress)

## Current Goal

Scaffold agent cron route and remaining lib structure.

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

## In Progress

- None yet.

## Next Up

1. Initialize remaining repository structure (`lib/agent/`, `lib/schemas/`, `components/`).
2. Scaffold agent: QStash verification, `/api/cron/morning-briefing` API route (stub).
3. Implement `fetch_watchlist_news` tool (Finnhub API, typed output, Zod-validated).
4. Implement `extract_relationships` tool (Vercel AI SDK `generateObject`, GPT-4.1-mini, Zod schema).
5. Implement `store_relationships` tool (Drizzle insert, `userId` scoped).
6. Wire up QStash cron → agent → Resend email delivery end to end.
7. Set up Clerk auth on Next.js dashboard.
8. Build dashboard pages: overview, relationship graph (React Flow), briefing history, watchlist management, settings.
9. Seed demo data and build demo mode (read-only Clerk account).
10. Build public landing page.

## Open Questions

- What is the exact Finnhub endpoint and rate limit behavior for watchlist news? Verify before building `fetch_watchlist_news`.
- ~~Should news items be deduplicated by URL hash before being sent to `extract_relationships`?~~ Resolved — yes. `news_items.rawContentHash` column + `idx_news_items_hash` index added in schema. (June 14, 2026)
- ~~What is the Railway project name and region for FinRel?~~ Resolved — no Railway needed, everything runs on Vercel.
- Resend domain verification needed before first email send.
- Dashboard UI theme — dark only or light/dark toggle? (Recommend dark only, consistent with the "calm technical research tool" feel from the spec.)
- Which Upstash Redis instance — shared with other projects or dedicated for FinRel? (Recommend dedicated to avoid key namespace collisions.)

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

## Session Notes

- Drizzle schema implemented (June 14, 2026). Migration `lib/db/migrations/0000_odd_puma.sql` applied to Neon — all tables and indexes verified.
- Context files created in one session from the grill interview (June 11, 2026).
- Root spec document: `financial-researcher-agent.md` — all implementation must align with it.
- The `02-extract-relationships-tool-spec.md` (Zod schemas + system prompt) is the highest-leverage next document to write before implementation starts — everything downstream depends on what that tool returns.
- cod3mate patterns to reuse: owner whitelist → replace with Clerk `userId` scoping; tool registry pattern; `/data` volume → replace with Neon Postgres.
