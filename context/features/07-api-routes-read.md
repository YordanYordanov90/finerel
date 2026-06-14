# 07 — API Routes: Read-Only Data (Relationships, Briefings, Graph)

**Depends on:** `01-drizzle-schema.md`, `09-auth.md`

---

## Purpose

Read-only API routes for the dashboard to fetch relationships, briefing history,
and graph data. These routes never insert or update data — the cron API routes
are the sole writer for relationships and briefings (architecture.md invariant 1).

---

## Files to Create

| Path | Purpose |
|---|---|
| `app/api/relationships/route.ts` | `GET` — filtered relationship queries |
| `app/api/briefings/route.ts` | `GET` — paginated briefing history |
| `app/api/graph/route.ts` | `GET` — React Flow nodes + edges |
| `lib/schemas/api-params.ts` | Zod schemas for query parameter validation |

---

## Requirements

### Authentication & Scoping

- All routes require Clerk auth — `userId` from `auth()`.
- Every query filters by `userId` (architecture.md invariant 2).
- Architecture.md invariant 1: "The cron API routes (`app/api/cron/`) are the only
  routes that write relationships and briefings to the database. Other API routes
  are read-only for these entities." — No INSERT/UPDATE/DELETE in these routes.

### GET `/api/relationships`

Query params (all optional, all Zod-validated):

| Param | Type | Validation | Default |
|---|---|---|---|
| `ticker` | string | 1–5 chars uppercase | — |
| `relationType` | string | One of `relationTypeSchema` values | — |
| `minConfidence` | number | 0–1 float | — |
| `startDate` | string | ISO date | — |
| `endDate` | string | ISO date | — |
| `limit` | number | 1–100 integer | 50 |
| `offset` | number | ≥0 integer | 0 |

- Filter by `userId` always.
- When `ticker` is provided, match against `sourceTicker` OR `targetTicker`.
- When `relationType` is provided, match the five types from
  core-intelligence-spec.md `relationTypeSchema`.
- When `minConfidence` is provided, filter `confidence >= minConfidence`.
- Date range filters on `extractedAt`.
- Response: `{ data: { relationships: ExtractedRelationship[], total: number } }`
- Empty results return `{ data: { relationships: [], total: 0 } }` — not an error.

### GET `/api/briefings`

Query params:

| Param | Type | Default |
|---|---|---|
| `limit` | number (1–50) | 20 |
| `offset` | number (≥0) | 0 |

- Filtered by `userId`, sorted by `briefingDate` descending.
- Response: `{ data: { briefings: Briefing[], total: number } }`
- Each briefing includes: `id`, `summary`, `itemsProcessed`,
  `relationshipsFound`, `briefingDate`, `createdAt`.

### GET `/api/graph`

- Returns `{ data: { nodes: Node[], edges: Edge[] } }` shaped for React Flow.
- **Nodes**: Unique companies from the user's relationships table.
  Each node: `{ id: companyName, data: { name, ticker, isWatchlist } }`.
  - `isWatchlist` is `true` if the company ticker is in the user's watchlist
    (architecture.md: React Flow reads nodes + edges via a single API query).
- **Edges**: Relationships between companies. Each edge:
  `{ id, source: sourceCompany, target: targetCompany, data: { relationType, confidence, impactLevel, contextSnippet, sourceUrl } }`.
- Architecture.md: "React Flow reads nodes + edges via a single API query.
  Graph complexity at 10–15 tickers over months is well within Postgres range."
- Deduplicate edges: if the same source→target pair has multiple relationships,
  return all as separate edges (different IDs).

### Response Shape

- `{ data: T }` on success, `{ error: string }` on failure (code-standards.md).
- Empty results are `{ data: { ..., total: 0 } }` — never errors.

---

## Acceptance Criteria

1. `GET /api/relationships` returns relationships filtered by `userId`.
2. All query param filters (ticker, relationType, minConfidence, date range) work correctly.
3. `GET /api/briefings` returns paginated briefing history sorted by date descending.
4. `GET /api/graph` returns a valid `{ nodes, edges }` structure where nodes are unique companies and edges are relationships.
5. `isWatchlist` flag on graph nodes is correctly set based on the user's watchlist.
6. All routes return empty arrays (not errors) when no data exists.
7. All routes return `401` for unauthenticated requests.
8. No route performs any INSERT, UPDATE, or DELETE operation.
9. All query params are Zod-validated — invalid values return `400`.

---

**Before closing this session:** Update `progress-tracker.md` — move read API routes to Completed, note the response shapes for frontend reference.
