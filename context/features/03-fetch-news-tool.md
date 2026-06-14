# 03 — Fetch Watchlist News Tool

**Depends on:** `01-drizzle-schema.md`, `02-agent-scaffold.md`

---

## Purpose

Implement the first agent tool: `fetch_watchlist_news`. It queries the Finnhub
API for per-ticker news, normalizes the response into `newsItemSchema` (from
core-intelligence-spec.md), and deduplicates against already-processed items
using `rawContentHash`.

---

## Files to Create

| Path | Purpose |
|---|---|
| `lib/agent/tools/fetch-watchlist-news.ts` | Tool implementation |
| `lib/schemas/news.ts` | Zod input/output schemas for the fetch tool |

---

## Requirements

### Finnhub Integration (from architecture.md, project-overview.md)

- Architecture.md: "Finnhub API (free tier) — Watchlist news — swappable when
  usage justifies upgrade."
- Endpoint: Finnhub company news API — fetches `headline`, `summary`, `url`,
  `source`, `datetime` per ticker (architecture.md decision: "Finnhub free tier
  as news source. Provides headline, summary, url, source, datetime per ticker").
- API key read from `process.env.FINNHUB_API_KEY` — never hardcoded, never logged
  (code-standards.md: "The Finnhub API key is server-side only — never referenced
  in client components or exposed in API responses").
- Use `fetch()` — no Finnhub SDK dependency needed.

### Input Schema (Zod-validated)

```ts
// lib/schemas/news.ts
const fetchNewsInputSchema = z.object({
  tickers: z.array(z.string().min(1).max(5)).min(1),
  fromDate: z.string().optional(),  // ISO date string, defaults to yesterday
  toDate: z.string().optional(),    // ISO date string, defaults to today
  limitPerTicker: z.number().int().positive().max(50).optional().default(25),
  userId: z.string(),
})
```

All inputs validated with Zod before any API call (code-standards.md: "Validate
all external input at system boundaries using Zod before trusting it — this
includes Finnhub API responses").

### Output Schema

Output must conform to `newsItemSchema` from core-intelligence-spec.md:

```ts
// Already defined in core-intelligence-spec.md §1
{
  id: string,           // Finnhub article ID or URL hash
  headline: string,
  summary: string,
  url: string (URL),
  source: string,
  publishedAt: string,  // ISO 8601
  mentionedTickers: string[],
}
```

Validate Finnhub API responses with Zod before returning — raw API responses
are not trusted (code-standards.md, core-intelligence-spec.md §1 notes).

### Deduplication (from progress-tracker.md open question, resolved)

- Compute `rawContentHash` per item as a hash of the article URL.
- Before returning results, query `news_items` table for existing hashes.
- Filter out any items whose `rawContentHash` already exists in the database.
- This prevents `extract_relationships` from processing the same article twice.
- Progress-tracker.md: "Should news items be deduplicated by URL hash before
  being sent to extract_relationships? (Recommended: yes — add raw_content_hash
  to news_items and skip already-processed items.)"

### Error Handling

- Finnhub API errors (rate limit, network) are caught and logged with context
  (ticker, HTTP status) — a failed fetch for one ticker must not prevent
  fetching for remaining tickers (code-standards.md: "Tool execution errors
  are caught and logged — a single failed tool call must not crash the entire
  briefing run").
- Return partial results if some tickers fail.

### Persistence

- New (non-duplicate) news items are inserted into the `news_items` table
  after fetching, before being returned to the caller.
- Every insert includes `userId` (architecture.md invariant 2).

---

## Acceptance Criteria

1. Tool fetches news for a single ticker (e.g. `NVDA`) and returns items matching `newsItemSchema`.
2. Tool fetches news for multiple tickers and returns combined, normalized results.
3. Each returned item has a valid `rawContentHash`.
4. Running the tool twice with the same ticker returns zero new items on the second run (deduplication works).
5. Finnhub API responses are Zod-validated — malformed responses are rejected, not silently passed through.
6. A failed Finnhub request for one ticker does not prevent results from other tickers.
7. All inserted `news_items` rows have the correct `userId`.
8. `FINNHUB_API_KEY` is never present in any log output.

---

**Before closing this session:** Update `progress-tracker.md` — move `fetch_watchlist_news` to Completed, note the Finnhub endpoint used and any rate limit observations.
