# 13 — Briefing History Page

**Depends on:** `07-api-routes-read.md`, `10-app-shell.md`

---

## Purpose

Searchable archive of past briefings with filters for relation type, confidence,
date range, and ticker.

---

## Files to Create

| Path | Purpose |
|---|---|
| `app/(app)/history/page.tsx` | Briefing history page |
| `components/history/BriefingTable.tsx` | Data table of briefings (`'use client'`) |
| `components/history/FilterBar.tsx` | Filter controls (`'use client'`) |
| `components/history/BriefingRow.tsx` | Expandable row showing briefing details + relationships |

---

## Requirements

### Data Source

- Fetch from `GET /api/briefings` with pagination params.
- Relationships for each briefing fetched on expand from `GET /api/relationships`
  filtered by date range or briefing ID.

### Layout (from ui-context.md)

- ui-context.md: "Briefing history: Data table with filters bar at top (relation type,
  confidence threshold, date range, ticker). Load-more pattern — no pagination modals."

### Filter Bar

| Filter | Control | Values |
|---|---|---|
| `relationType` | Multi-select dropdown | All 5 types from `relationTypeSchema` |
| `minConfidence` | Slider or select | 0.0–1.0, step 0.1 |
| `dateRange` | Date picker (start + end) | |
| `ticker` | Text input | Uppercase, 1–5 chars |

- Filters are applied as query params to the API call.
- All filter values Zod-validated before sending.

### Briefing Table

- Each row shows: `briefingDate`, `summary` (truncated), `itemsProcessed`,
  `relationshipsFound`.
- Rows are expandable — clicking a row shows the full summary and all
  relationships from that briefing.
- Expanded relationships use the same card pattern as the overview page
  (RelationshipCard from `11-overview-page.md`).

### Badges (from ui-context.md §Muted Metadata Badge)

- Relation type and impact level badges use the muted metadata badge pattern:
  ```
  inline-flex items-center rounded-full border px-2 py-0.5 text-[10px]
  font-medium uppercase tracking-wider
  border-zinc-700 bg-zinc-900/60 text-zinc-400
  ```

### Load More

- Load-more button at the bottom — fetches next page.
- No pagination modals or page numbers.

---

## Acceptance Criteria

1. Table renders with briefing history sorted by date descending.
2. All four filters (relationType, minConfidence, dateRange, ticker) work correctly.
3. Load-more button fetches and appends the next page of results.
4. Expanded row shows full summary and associated relationships.
5. Metadata badges match the `fr-badge` / muted metadata pattern from ui-context.md.
6. Empty state renders when no briefings exist.

---

**Before closing this session:** Update `progress-tracker.md` — move briefing history to Completed.
