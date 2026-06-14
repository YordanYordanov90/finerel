# 01 — Drizzle Schema & Neon Connection

**Depends on:** Nothing — this is the foundation.

---

## Purpose

Define all Drizzle ORM table schemas and establish the Neon Postgres connection.
Every downstream feature (agent tools, API routes, dashboard pages) depends on
this schema being correct and migrated.

---

## Files to Create

| Path | Purpose |
|---|---|
| `lib/db/schema.ts` | All Drizzle table definitions |
| `lib/db/index.ts` | Neon serverless connection + Drizzle client export |
| `drizzle.config.ts` | Drizzle Kit configuration (Neon connection string from `DATABASE_URL`) |
| `.env.local` | `DATABASE_URL` placeholder (never committed) |
| `.gitignore` update | Ensure `.env*` files are ignored |

---

## Requirements

### Connection (from architecture.md)

- Use `@neondatabase/serverless` driver with `drizzle-orm/neon-serverless`.
- `DATABASE_URL` read from `process.env.DATABASE_URL` — never hardcoded.
- Export a typed `db` instance from `lib/db/index.ts` for use across all routes
  (architecture.md: "lib/db/ — Drizzle ORM schema, migrations, and query helpers.
  Shared across all routes").

### Tables (from architecture.md, core-intelligence-spec.md, project-overview.md)

All tables use `pgTable` from `drizzle-orm/pg-core`. Every table that stores
user data includes a `userId` column (`text`, not null) scoped to the Clerk
`userId` string (architecture.md invariant 2: "Every database query filters
by userId — no query ever returns data across users").

#### `users`

| Column | Type | Notes |
|---|---|---|
| `id` | `text` PK | Clerk `userId` — the foreign key for all other tables |
| `email` | `text` not null | From Clerk webhook `user.created` |
| `briefingTime` | `text` default `'07:00'` | EEST cron preference (read-only in MVP) |
| `createdAt` | `timestamp` default `now()` | |
| `updatedAt` | `timestamp` default `now()` | |

#### `watchlists`

| Column | Type | Notes |
|---|---|---|
| `id` | `serial` PK | |
| `userId` | `text` not null | FK → users.id |
| `ticker` | `text` not null | Uppercase, 1–5 chars (validated at API layer) |
| `addedAt` | `timestamp` default `now()` | |

Unique constraint on `(userId, ticker)` — no duplicate tickers per user.

#### `companies`

From architecture.md: "companies table: canonical name + ticker aliases for
entity normalization."

| Column | Type | Notes |
|---|---|---|
| `id` | `serial` PK | |
| `canonicalName` | `text` not null unique | e.g. "NVIDIA" |
| `ticker` | `text` nullable | Primary ticker symbol if known, e.g. "NVDA" |
| `createdAt` | `timestamp` default `now()` | |

#### `news_items`

From core-intelligence-spec.md `newsItemSchema`:

| Column | Type | Notes |
|---|---|---|
| `id` | `text` PK | Finnhub article ID or URL hash |
| `userId` | `text` not null | Scoped to the user whose watchlist triggered the fetch |
| `headline` | `text` not null | Article headline |
| `summary` | `text` not null | 2–3 sentence summary from Finnhub |
| `url` | `text` not null | Source article URL |
| `source` | `text` not null | Publisher name |
| `publishedAt` | `timestamp` not null | From Finnhub `datetime` field |
| `mentionedTickers` | `text[]` not null | Array of ticker strings |
| `rawContentHash` | `text` not null | URL hash for deduplication (progress-tracker.md open question — resolved: yes) |
| `createdAt` | `timestamp` default `now()` | |

#### `relationships`

From core-intelligence-spec.md `extractedRelationshipSchema` — field names and
types must match exactly:

| Column | Type | Notes |
|---|---|---|
| `id` | `serial` PK | |
| `userId` | `text` not null | Set by tool, never by model (core-intelligence-spec.md §4 security note) |
| `sourceCompany` | `text` not null | Canonical company name |
| `sourceTicker` | `text` nullable | Ticker if identifiable |
| `targetCompany` | `text` not null | Canonical company name |
| `targetTicker` | `text` nullable | |
| `relationType` | `text` not null | One of: `partnership`, `supply_chain`, `executive_mention`, `product_collaboration`, `investment` (core-intelligence-spec.md `relationTypeSchema`) |
| `confidence` | `real` not null | 0.0–1.0 float (core-intelligence-spec.md §2 field rules) |
| `impactLevel` | `text` not null | One of: `high`, `medium`, `low` (core-intelligence-spec.md `impactLevelSchema`) |
| `contextSnippet` | `text` not null | Max 300 chars, from source article |
| `sourceNewsId` | `text` not null | References news_items.id |
| `sourceUrl` | `text` not null | Passed through from newsItemSchema.url |
| `extractedAt` | `timestamp` not null | Set by tool, never by model |
| `briefingId` | `integer` nullable | FK → briefings.id, links relationship to its briefing run |
| `createdAt` | `timestamp` default `now()` | |

#### `briefings`

| Column | Type | Notes |
|---|---|---|
| `id` | `serial` PK | |
| `userId` | `text` not null | |
| `summary` | `text` not null | 2–4 sentence briefing summary (core-intelligence-spec.md `extractionOutputSchema.summary`, max 500 chars) |
| `itemsProcessed` | `integer` not null | From `extractionOutputSchema.itemsProcessed` |
| `relationshipsFound` | `integer` not null | Count of relationships extracted in this run |
| `briefingDate` | `date` not null | The date this briefing covers |
| `createdAt` | `timestamp` default `now()` | |

### Indexes

| Index | Columns | Rationale |
|---|---|---|
| `idx_relationships_user_ticker` | `userId`, `sourceTicker` | Fast lookup for per-ticker relationship queries |
| `idx_relationships_user_type` | `userId`, `relationType` | Filter by relationship type on dashboard |
| `idx_news_items_hash` | `rawContentHash` | Deduplication check before extraction (progress-tracker.md) |
| `idx_briefings_user_date` | `userId`, `briefingDate` | Briefing history sorted by date, scoped to user |
| `idx_watchlists_user` | `userId` | Fast watchlist retrieval |

### Drizzle Config

```ts
// drizzle.config.ts
{
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL }
}
```

### Migration

- Run `npx drizzle-kit generate` to produce the first migration in `lib/db/migrations/`.
- Run `npx drizzle-kit migrate` to apply.
- Migration files are tracked in git (code-standards.md: "Generate migration files
  with drizzle-kit generate (tracked in git)").
- Never use `drizzle-kit push` except for quick local prototyping (code-standards.md).

---

## Acceptance Criteria

1. `npx drizzle-kit generate` produces a clean migration file with no errors.
2. `npx drizzle-kit migrate` applies successfully against Neon Postgres.
3. All six tables (`users`, `watchlists`, `companies`, `news_items`, `relationships`, `briefings`) exist in the database.
4. A test insert and select works for each table (manual or script).
5. All five indexes are created and visible in the database.
6. The `relationships` table columns match `extractedRelationshipSchema` from `core-intelligence-spec.md` exactly.
7. `userId` column exists on every user-scoped table.
8. `lib/db/index.ts` exports a typed `db` instance that connects successfully.
9. `.env.local` is gitignored.

---

**Before closing this session:** Update `progress-tracker.md` — move "Define Drizzle schema" to Completed, note the migration file path, and record any decisions made.
