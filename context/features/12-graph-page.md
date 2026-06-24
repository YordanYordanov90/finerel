# 12 — Relationship Graph Page

**Depends on:** `07-api-routes-read.md`, `10-app-shell.md`

---

## Purpose

Interactive React Flow visualization of the user's relationship graph.
Companies are nodes, relationships are typed colored edges.

---

## Files to Create

| Path | Purpose |
|---|---|
| `app/(app)/graph/page.tsx` | Graph page wrapper (server component for data fetch) |
| `components/graph/RelationshipGraph.tsx` | React Flow canvas (`'use client'`) |
| `components/graph/CompanyNode.tsx` | Custom React Flow node for companies |
| `components/graph/RelationshipEdge.tsx` | Custom React Flow edge with type-based coloring |
| `components/graph/NodeDetailDrawer.tsx` | shadcn Sheet — company detail on node click |
| `components/graph/GraphControls.tsx` | Floating zoom/fit/reset controls |

---

## Requirements

### Data Source

- Fetch from `GET /api/graph` — returns `{ nodes, edges }`.
- Server component fetches data, passes to client React Flow component.

### Node Rendering (from ui-context.md §Relationship Graph Specifics)

- Shape: rounded rectangle (`rounded-xl`).
- Surface: `bg-[#111111]`, `border-zinc-800`.
- Company name: `font-sans text-zinc-100`.
- Ticker symbol below name: `font-mono text-cyan-300/95`.
- **Watchlist nodes**: larger size + `border-cyan-500/50` to distinguish from
  discovered/peripheral companies (ui-context.md: "Watchlist nodes: Larger size +
  border-cyan-500/50 border to distinguish from discovered/peripheral companies").

### Edge Rendering (from ui-context.md §Relationship Edge Colors)

Color by `relationType`:

| Relationship type | Color | Hex |
|---|---|---|
| `partnership` | cyan-500 | `#06B6D4` |
| `supply_chain` | violet-400 | `#a78bfa` |
| `investment` | emerald-400 | `#34d399` |
| `executive_mention` | amber-400 | `#fbbf24` |
| `product_collaboration` | pink-400 | `#f472b6` |

- ui-context.md: "Partnership edges use the cyan accent — it's the most significant
  relationship type and the most likely to appear on a user's watchlist."
- Edge thickness scales with `confidence` — thicker = higher confidence.
- Label shown on hover only (ui-context.md: "Label shown on hover only to avoid clutter").

### Node Click → Detail Drawer

- Clicking a node opens a shadcn Sheet drawer from the right.
- ui-context.md: "shadcn Sheet is used for the node detail drawer (slides in from
  right on graph node click)."
- Drawer shows:
  - Company name and ticker
  - All relationships involving that company (as source or target)
  - Each relationship: type badge, confidence score (colored), impact level,
    context snippet, source URL link
  - Does not navigate away from the graph page.

### Layout

- Force-directed layout for initial positioning (ui-context.md: "Layout:
  Force-directed (dagre or elk) for initial positioning").
- Full-width React Flow canvas within the app shell.

### Controls

- Floating controls panel: zoom in, zoom out, fit view, reset layout.
- ui-context.md: "Floating controls panel."

### Empty State

- When no relationships exist: show empty state with message.
- Lucide icon `h-8 w-8`.

---

## Acceptance Criteria

1. Graph renders with data from `/api/graph`.
2. Watchlist nodes are visually distinct (`border-cyan-500/50`, larger size).
3. Edge colors match the relation type table from ui-context.md exactly.
4. Edge thickness scales with confidence value.
5. Edge labels appear on hover only.
6. Node click opens shadcn Sheet drawer with correct company details.
7. Drawer shows all relationships for the clicked company.
8. Graph is navigable: pan, zoom, fit view work correctly.
9. Empty state renders when no relationships exist.
10. Force-directed layout positions nodes on initial render.

---

**Before closing this session:** Update `progress-tracker.md` — move graph page to Completed.
