# 17 — Demo Data Seeding

**Depends on:** All previous features (01–16).

---

## Purpose

Seed the demo account with realistic relationship data so the demo dashboard
looks genuinely useful — a connected graph, diverse relationship types, and
30 days of briefing history. This is the portfolio presentation layer.

---

## Files to Create

| Path | Purpose |
|---|---|
| `scripts/seed-demo.ts` | Runnable seed script (`tsx` or `ts-node`) |
| `scripts/seed-data/relationships.ts` | Handcrafted relationship data |
| `scripts/seed-data/briefings.ts` | Handcrafted briefing summaries |
| `scripts/seed-data/news-items.ts` | Realistic news items backing the relationships |

---

## Requirements

### Demo Account (from architecture.md)

- Architecture.md: "Demo mode: a pre-seeded read-only Clerk account with fixed
  userId. Dashboard detects demo mode via a flag and disables all mutation operations."
- Seeds the `DEMO_USER_ID` account — read from environment or hardcoded in the
  seed script as a constant.

### Watchlist

- Fixed demo watchlist: `NVDA`, `TSMC`, `AAPL`, `MSFT`, `GOOGL`.
- These are the "focus tickers" — most relationships should involve these companies.

### Relationships

- Minimum **60 relationships** across all five relation types from
  core-intelligence-spec.md `relationTypeSchema`:
  - `partnership`
  - `supply_chain`
  - `executive_mention`
  - `product_collaboration`
  - `investment`
- All five types must be represented — not concentrated in one or two.
- Confidence distribution (realistic, not uniform):
  - ~40% high (0.8–1.0)
  - ~40% medium (0.5–0.79)
  - ~20% low (0.0–0.49)
- This distribution ensures all three confidence tiers show their correct colors
  on the dashboard (ui-context.md: neon-400 for high, amber-400 for medium,
  rose-400 for low).
- Impact levels: mix of high, medium, low across relationships.
- `contextSnippet` on each relationship: realistic 1–2 sentence quotes
  (max 300 chars per core-intelligence-spec.md).
- `sourceUrl`: use realistic-looking URLs (can be placeholder domains).
- `extractedAt`: spread across the last 30 days.

### Graph Requirements

- At least **8 unique company nodes** — enough for a visually connected graph.
- At least **15 edges** between different company pairs.
- The graph must look genuinely connected when rendered with React Flow —
  not a disconnected set of isolated pairs.
- Include at least 2–3 companies that are not in the watchlist (discovered
  through relationships with watchlist companies) — these test the visual
  distinction between watchlist nodes (`border-neon-500/50`) and
  non-watchlist nodes.

### Briefings

- At least **3 briefing records** with realistic summary text.
- Summaries should reference specific companies and relationship types
  (core-intelligence-spec.md: "summary — Written for the briefing email. Plain
  language, no jargon. Names the most significant 1–2 relationships found").
- Spread across the last 30 days to populate briefing history.
- `itemsProcessed` and `relationshipsFound` should be realistic (5–15 items
  processed, 2–8 relationships found per briefing).

### News Items

- Backing news items for each relationship's `sourceNewsId` reference.
- Fields matching `newsItemSchema` from core-intelligence-spec.md.
- `rawContentHash` populated for each (deduplication field).

### Idempotency

- Running the script twice does not duplicate data.
- Implementation: check for existing demo user data before inserting, or
  delete-and-reseed pattern (acceptable for demo data only).

### Script Execution

- Runnable via `npx tsx scripts/seed-demo.ts`.
- Connects to the database using `DATABASE_URL` from `.env.local`.
- Logs progress: "Seeding users... Seeding watchlist... Seeding news items...
  Seeding relationships... Seeding briefings... Done."
- Exits cleanly with code 0 on success.

---

## Acceptance Criteria

1. Script runs cleanly with `npx tsx scripts/seed-demo.ts` and exits with code 0.
2. Running the script twice does not create duplicate data.
3. Demo dashboard overview page shows relationship cards with all three confidence
   color tiers (neon, amber, rose).
4. Demo dashboard graph page shows a connected multi-node graph with at least
   8 company nodes and 15 edges.
5. Watchlist nodes are visually distinct from non-watchlist nodes in the graph.
6. All five relationship types are present in the seeded data.
7. Briefing history shows entries spread across 30 days.
8. Each relationship has a valid `sourceNewsId` referencing a news item.
9. Confidence distribution is approximately 40/40/20 (high/medium/low).
10. Demo account is read-only — all mutation endpoints return 403.

---

**Before closing this session:** Update `progress-tracker.md` — move demo seeding to Completed, mark Phase 1 Foundation as complete if all features are done.
