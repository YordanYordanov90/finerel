# Chat Agent — Tool Set

**Status:** Design
**Last updated:** June 29, 2026
**Backbone:** `agent-plan.md` (§5 The tool set, §7 Boundaries).
**Sibling docs:** `chat-schema.md`, `chat-ui.md`.

---

## 1. Purpose

Define the read-only, `userId`-scoped tools the chat agent calls to ground its
answers in the user's own data. These are AI SDK `tool()` definitions passed to
the `streamText` loop. Each wraps a query path that already serves the dashboard,
so the agent and the UI read through the same logic.

---

## 2. The contract every tool follows

- **`userId` is never a tool parameter.** It is closed over from the
  authenticated session when the tools are constructed per request. The model
  cannot see it, set it, or spoof it — it only chooses *what* to ask, never *whose*
  data. (This is the §7 boundary, enforced in code.)
- **Read-only.** No tool writes, sends, or mutates. No `add_ticker`, no email.
- **Input validated with Zod**, reusing the schemas in `lib/schemas/api-params.ts`
  where they already exist (minus any `userId`/pagination fields the agent
  shouldn't drive).
- **Token-aware output.** Tools return compact, model-friendly shapes: capped
  result counts, ISO dates, truncated snippets — the same discipline
  `extract-relationships.ts` already applies. Large structures (e.g. the full
  graph) are summarized, not dumped.
- **Errors are returned, not thrown.** On failure a tool returns a short
  structured error the model can relay ("couldn't load relationships"); it never
  rejects the whole request. Combined with the step cap in `agent-plan.md` §4,
  this keeps a bad turn graceful.

---

## 3. The tools

| Tool | Input | Returns | Backed by |
| --- | --- | --- | --- |
| `get_watchlist` | none | The user's tickers + when each was added. | `watchlists` |
| `query_relationships` | `ticker?`, `relationType?`, `minConfidence?`, `startDate?`, `endDate?`, `limit?` (reuse `relationshipsQuerySchema`) | Matching relationships: source/target company + ticker, type, confidence, impact, context snippet, source URL, date. | `relationships` (the filter logic currently inline in `app/api/relationships/route.ts`) |
| `get_graph_stats` | none | Summary aggregates: node count, edge count, most-connected companies, counts by relation type, watchlist coverage. **Not** the full node/edge list. | `getGraphData` in `lib/data/graph.ts`, reduced to stats |
| `search_news` | `ticker?`, `query?`, `startDate?`, `endDate?`, `limit?` | Matching news items: headline, summary, source, published date, URL, mentioned tickers. | `news_items` |
| `get_briefing_history` | `limit?`, `offset?` (reuse `briefingsQuerySchema`) | Past briefings: date, summary, items processed, relationships found. | `briefings` |

---

## 4. Shared query layer

Tools must not duplicate query logic that lives in API routes. Extract the shared
logic into `lib/data/*` so route and tool call one function:

- `query_relationships`'s filter logic currently sits inline in
  `app/api/relationships/route.ts` — lift it into `lib/data/relationships.ts` and
  have both the route and the tool call it.
- `get_graph_stats` reuses `lib/data/graph.ts`, adding a stats reducer rather than
  returning the raw graph.
- `get_watchlist`, `search_news`, `get_briefing_history` follow the same pattern:
  one `userId`-scoped query helper in `lib/data/`, consumed by both surfaces.

This keeps a single source of truth for "how we read X for a user" and means the
chat agent and the dashboard can never drift apart.

---

## 5. How the agent uses them

The agent is not forced to call every tool. It chooses the path the question needs
— a watchlist question may hit only `get_watchlist`; "what changed for NVDA this
week?" pulls `query_relationships` (filtered) and maybe `search_news`; "what's my
most connected company?" calls `get_graph_stats`. That selection *is* the agent
loop (`agent-plan.md` §4–§5). A hard cap on tool-call steps bounds each turn.

---

## 6. Out of scope (deferred)

- **Write tools** — adding/removing tickers, editing settings.
- **Send tools** — composing or sending email; the briefing pipeline owns that and
  stays deterministic (`agent-plan.md` §1, §8).
- **Cross-user or admin queries** — every tool is single-user by construction.
