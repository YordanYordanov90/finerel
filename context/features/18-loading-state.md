# 18 — Loading States

**Depends on:** `10-app-shell.md`, `11-overview-page.md`, `12-graph-page.md`,
`13-briefing-history-page.md`, `14-watchlist-page.md`, `15-settings-page.md`

---

## Purpose

Add loading states to all dashboard pages so users see immediate visual feedback
while data is being fetched. Uses shadcn Skeleton component as the primary
loading primitive.

---

## Setup

Install the shadcn Skeleton component:

```bash
npx shadcn@latest add skeleton
```

This adds `components/ui/skeleton.tsx`.

---

## Files to Create

| Path | Purpose |
|---|---|
| `components/ui/skeleton.tsx` | shadcn Skeleton primitive (installed via CLI) |
| `app/(app)/overview/loading.tsx` | Overview page loading state |
| `app/(app)/graph/loading.tsx` | Graph page loading state |
| `app/(app)/history/loading.tsx` | History page loading state |
| `app/(app)/watchlist/loading.tsx` | Watchlist page loading state |
| `app/(app)/settings/loading.tsx` | Settings page loading state |

---

## Requirements

### Approach

Next.js `loading.tsx` convention — each route segment gets a `loading.tsx` file
that renders automatically while the page's server component fetches data.
This is the simplest approach: no Suspense boundaries to manage manually,
no client-side loading state, and it works out of the box with server components.

### Skeleton Styling

shadcn Skeleton uses `animate-pulse` with a muted background. Override the
default background to match the dark theme:

```
bg-zinc-800/50
```

This keeps skeletons visible on the `#0a0a0a` / `bg-[#111111]` surfaces without
being too bright.

### Overview Page Loading (`app/(app)/overview/loading.tsx`)

Mirror the 2-column layout from `11-overview-page.md`:

- **Left column (relationship feed):** 3–4 stacked card skeletons. Each card
  skeleton has:
  - A short line (company arrow notation) — `<Skeleton className="h-5 w-48" />`
  - A row of 2–3 small badge skeletons — `<Skeleton className="h-4 w-16" />`
  - Two body text lines — `<Skeleton className="h-4 w-full" />`,
    `<Skeleton className="h-4 w-3/4" />`
  - Card wrapper uses `fr-card` class for consistent surface.

- **Right column (briefing summary):** Single card skeleton with:
  - Heading line — `<Skeleton className="h-6 w-32" />`
  - 3 body text lines of varying width
  - 2 small metadata lines

- Responsive: single column on mobile (same as the real page).

### Graph Page Loading (`app/(app)/graph/loading.tsx`)

- Full-width container matching the graph canvas area.
- Center a group of skeleton elements suggesting a graph:
  - 4–5 rounded rectangle skeletons (node placeholders) scattered in the area.
  - Or a single large `<Skeleton className="h-[calc(100vh-8rem)] w-full rounded-xl" />`
    as a canvas placeholder.
- Keep it simple — a single full-area skeleton is fine since the graph is a
  single canvas element.

### History Page Loading (`app/(app)/history/loading.tsx`)

Mirror the filter bar + table layout from `13-briefing-history-page.md`:

- **Filter bar:** Row of 4 skeleton inputs —
  `<Skeleton className="h-9 w-40" />` repeated, with spacing.
- **Table rows:** 5–6 row skeletons, each with:
  - Date column — `<Skeleton className="h-4 w-24" />`
  - Summary column — `<Skeleton className="h-4 w-64" />`
  - Two small metric columns — `<Skeleton className="h-4 w-12" />`

### Watchlist Page Loading (`app/(app)/watchlist/loading.tsx`)

Mirror the ticker list from `14-watchlist-page.md`:

- **Add ticker input:** `<Skeleton className="h-9 w-64" />` at the top.
- **Ticker rows:** 4–5 rows, each with:
  - Ticker pill skeleton — `<Skeleton className="h-6 w-16 rounded-full" />`
  - Relationship count — `<Skeleton className="h-4 w-20" />`
  - Date — `<Skeleton className="h-4 w-24" />`
  - Action icon — `<Skeleton className="h-4 w-4 rounded" />`

### Settings Page Loading (`app/(app)/settings/loading.tsx`)

Mirror the single-column grouped sections from `15-settings-page.md`:

- 2 section skeletons, each with:
  - Section heading — `<Skeleton className="h-5 w-32" />`
  - Content line — `<Skeleton className="h-4 w-48" />`
- Simple and minimal — settings page has little content.

---

## Acceptance Criteria

1. shadcn Skeleton component is installed at `components/ui/skeleton.tsx`.
2. Every dashboard route (`overview`, `graph`, `history`, `watchlist`, `settings`)
   has a `loading.tsx` file.
3. Loading skeletons match the shape and layout of each page's actual content.
4. Skeleton background color is `bg-zinc-800/50` to match the dark theme.
5. Loading states appear automatically during server-side data fetching
   (no manual Suspense required).
6. Layout is responsive — loading states collapse to single column on mobile
   where the real page does.
7. No layout shift when the real content replaces the loading skeleton.

---

**Before closing this session:** Update `progress-tracker.md` — move loading states to Completed.
