# 25 — Chat Agent Tools (read-only)

**Depends on:** `01-drizzle-schema.md`, `24-chat-schema.md`
**Design spec:** `agent/chat-tools.md` (source of truth for this feature)

---

## Purpose

Build the read-only, `userId`-scoped tool set the chat agent calls to ground its
answers in the user's own data, plus the shared query layer those tools and the
existing dashboard routes both read through. Tools only — the route that wires
them into a model loop is feature 26.

---

## Files to Create

| Path | Purpose |
|---|---|
| `lib/data/relationships.ts` | Extract the relationship filter query (currently inline in `app/api/relationships/route.ts`) into a shared, `userId`-scoped helper |
| `lib/data/watchlist.ts` | `userId`-scoped watchlist read |
| `lib/data/news.ts` | `userId`-scoped news read |
| `lib/data/briefings.ts` | `userId`-scoped briefing-history read |
| `lib/data/graph-stats.ts` | Reduce `getGraphData` into summary stats |
| `lib/agent/chat-tools.ts` | The AI SDK `tool()` definitions, constructed per request with `userId` closed over |

---

## Requirements

### The contract (from `agent/chat-tools.md` §2)

- **`userId` is never a tool parameter.** Tools are built by a factory
  (`buildChatTools(userId)`) that closes over the session `userId`. The model
  chooses *what* to ask, never *whose* data — it cannot see or set `userId`.
- **Read-only.** No tool writes, sends, or mutates.
- **Zod-validated input**, reusing `lib/schemas/api-params.ts` where schemas
  already exist (drop any `userId`/`offset` fields the agent shouldn't drive).
- **Token-aware output** — capped counts, ISO dates, truncated snippets (same
  discipline as `extract-relationships.ts`). `get_graph_stats` returns aggregates,
  never the full node/edge list.
- **Errors are returned, not thrown** — a tool returns a short structured error
  string the model can relay; it never rejects the request.

### Tools

| Tool | Input | Returns | Helper |
|---|---|---|---|
| `get_watchlist` | none | Tickers + `addedAt` | `lib/data/watchlist.ts` |
| `query_relationships` | `ticker?`, `relationType?`, `minConfidence?`, `startDate?`, `endDate?`, `limit?` (reuse `relationshipsQuerySchema`) | Matching relationships (source/target, type, confidence, impact, snippet, url, date) | `lib/data/relationships.ts` |
| `get_graph_stats` | none | Node count, edge count, most-connected companies, counts by relation type, watchlist coverage | `lib/data/graph-stats.ts` |
| `search_news` | `ticker?`, `query?`, `startDate?`, `endDate?`, `limit?` | Matching news items (headline, summary, source, date, url, tickers) | `lib/data/news.ts` |
| `get_briefing_history` | `limit?` (reuse `briefingsQuerySchema`) | Past briefings (date, summary, items processed, relationships found) | `lib/data/briefings.ts` |

### Shared query layer

- Lift the filter logic from `app/api/relationships/route.ts` into
  `lib/data/relationships.ts` and have the **route call the helper too** — one
  source of truth, dashboard and agent can't drift.
- Each helper is a single `userId`-scoped query. No helper accepts data from
  another user by construction.

---

## Acceptance Criteria

1. `buildChatTools(userId)` returns the five tools; none expose `userId` in their input schema.
2. Every tool query filters by the closed-over `userId`.
3. No tool performs INSERT/UPDATE/DELETE or sends anything.
4. `app/api/relationships/route.ts` now calls `lib/data/relationships.ts` (no duplicated filter logic).
5. `get_graph_stats` returns summary aggregates, not the raw graph.
6. Each tool's input is Zod-validated; invalid input yields a structured error, not a thrown request.
7. Tool outputs are capped/truncated for token economy.

---

**Before closing this session:** Update `progress-tracker.md` — mark feature 25 done, note the new `lib/data/*` helpers and that the relationships route was refactored onto the shared helper.
