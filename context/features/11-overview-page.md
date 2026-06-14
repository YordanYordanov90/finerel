# 11 — Overview Page

**Depends on:** `07-api-routes-read.md`, `10-app-shell.md`

---

## Purpose

The dashboard landing page — shows today's extracted relationships and the
current briefing summary at a glance.

---

## Files to Create

| Path | Purpose |
|---|---|
| `app/(app)/page.tsx` | Overview page (server component) |
| `components/relationships/RelationshipCard.tsx` | Single relationship card |
| `components/briefing/BriefingSummaryCard.tsx` | Today's briefing summary display |
| `components/EmptyState.tsx` | Reusable empty state component |

---

## Requirements

### Layout (from ui-context.md)

- ui-context.md: "Overview page: 2-column grid — relationship feed on left (wider),
  today's briefing summary card on right. Collapses to single column on mobile."

### Relationship Feed

- Fetch today's relationships from `GET /api/relationships?startDate=<today>&endDate=<today>`,
  sorted by confidence descending.
- Server component — fetch data server-side (code-standards.md: "Server components
  fetch directly with Drizzle" — or via internal API call).

### RelationshipCard

Each card displays:

| Field | Rendering | Reference |
|---|---|---|
| `sourceCompany` → `targetCompany` | Arrow notation, company names in `text-zinc-100` | |
| `relationType` | Muted metadata badge: `fr-badge` pattern from ui-context.md | |
| `confidence` | Percentage + label with semantic color from ui-context.md confidence table: ≥0.8 `text-neon-400` "High", 0.5–0.79 `text-amber-400` "Medium", <0.5 `text-rose-400` "Low" | ui-context.md §Confidence Score Display |
| `impactLevel` | Muted metadata badge (`fr-badge`) | ui-context.md §Muted Metadata Badge |
| `contextSnippet` | Body text, `text-zinc-400`, max 300 chars | core-intelligence-spec.md |
| `sourceUrl` | External link icon, opens source article | |
| Ticker symbols | `font-mono text-neon-300/95 bg-black/55 border border-zinc-800 rounded-md px-1.5 py-0.5 text-xs` | ui-context.md §Ticker symbols |

- ui-context.md: "Always show both the percentage and the label. Never show raw
  decimal values to users."
- Card surface: `fr-card` (bg-[#111111], border-zinc-800, rounded-xl).

### Briefing Summary Card

- Fetch today's briefing from `GET /api/briefings?limit=1`.
- Display `summary` text (plain language, max 500 chars).
- Show `itemsProcessed` and `relationshipsFound` as metadata.
- Card surface: `fr-card`.

### Empty State

- When no briefing has run yet (no data for today), show a clean empty state.
- Lucide icon at `h-8 w-8` (ui-context.md: "Empty states — h-8 w-8").
- Message: "No briefing yet today. Your morning briefing runs at 09:00 EEST."

---

## Acceptance Criteria

1. Page renders inside the app shell on the `/` route.
2. Relationship cards display all required fields with correct formatting.
3. Confidence colors match ui-context.md thresholds: neon-400 for ≥0.8, amber-400 for 0.5–0.79, rose-400 for <0.5.
4. Ticker symbols use the `font-mono` neon pill style from ui-context.md.
5. Briefing summary card shows today's summary text.
6. Empty state renders cleanly when no data exists.
7. 2-column layout on desktop, single column on mobile.
8. All metadata badges use the `fr-badge` pattern.

---

**Before closing this session:** Update `progress-tracker.md` — move overview page to Completed.
