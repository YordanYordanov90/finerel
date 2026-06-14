# 10 — App Shell (Sidebar, Navbar, Layout)

**Depends on:** `09-auth.md`

---

## Purpose

Build the authenticated dashboard shell: sidebar navigation, top navbar, and
the `globals.css` utility classes. This layout wraps all dashboard pages.

---

## Files to Create

| Path | Purpose |
|---|---|
| `app/(app)/layout.tsx` | Authenticated app shell layout with sidebar + main content |
| `components/AppSidebar.tsx` | Fixed 240px sidebar with navigation links |
| `components/AppNavbar.tsx` | Sticky top navbar with breadcrumb area and Clerk UserButton |
| `app/globals.css` update | Add `fr-*` shell utilities matching ui-context.md |

---

## Requirements

### Layout (from ui-context.md Layout Patterns)

- ui-context.md: "Dashboard shell: Fixed left sidebar (240px), border-zinc-800
  separator, main content fills remaining width. Top navbar sticky with
  bg-zinc-950/80 backdrop-blur-md and bottom border."
- Dark only — no light mode toggle (ui-context.md: "Dark only. No light mode for MVP").
- `app/(app)/layout.tsx` wraps all dashboard routes inside the `(app)` route group.

### Sidebar — `components/AppSidebar.tsx`

- Fixed width: 240px.
- Right border: `border-zinc-800` (ui-context.md border token).
- Navigation links with icons (Lucide React, `h-5 w-5` per ui-context.md):
  - Overview → `/` (app root)
  - Graph → `/graph`
  - History → `/history`
  - Watchlist → `/watchlist`
  - Settings → `/settings`
- Active route highlighted using `usePathname()` — `'use client'` directive needed.
- Active state: `text-neon-400` accent (ui-context.md accent text).
- Inactive state: `fr-nav-muted` token (ui-context.md Shell Utilities).
- FinRel logo wordmark at top: `Fin` in zinc-100 + `Rel` in neon-400/500
  (ui-context.md: "Logo wordmark: Fin + accent Rel (neon-400/500)").
  Syne font for the wordmark (ui-context.md: "Syne — Page titles, section headings,
  logo wordmark").
- Responsive: sidebar collapses on mobile (hidden below `md` breakpoint,
  toggle via hamburger in navbar).

### Navbar — `components/AppNavbar.tsx`

- Sticky top: `sticky top-0 z-50`.
- Background: `bg-zinc-950/80 backdrop-blur-md` (ui-context.md).
- Bottom border: `border-zinc-800`.
- Left side: breadcrumb area showing current page name.
- Right side: Clerk `<UserButton />` component.

### Shell Utilities in `globals.css` (from ui-context.md Shell Utilities)

Define exactly these utility classes:

| Utility | Purpose (from ui-context.md) |
|---|---|
| `.fr-page` | Root page background (`#0a0a0a`) + neon radial glow |
| `.fr-nav` | Sticky navbar background + backdrop-blur |
| `.fr-nav-muted` | Muted nav link / inactive pill |
| `.fr-card` | Standard card surface + zinc-800 border |
| `.fr-badge` | Muted metadata badge (ticker, relation type, impact) |
| `.fr-heading` | Heading typography (Syne) |
| `.fr-cta-btn` | Primary neon-accent CTA button |

### Typography (from ui-context.md)

- Body/UI: Inter (`font-sans`)
- Headings/brand: Syne (`font-heading`)
- Mono/data: Geist Mono (`font-mono`)
- Configure all three in `app/layout.tsx` via `next/font`.

### Icons (from ui-context.md)

- Lucide React, stroke-based only.
- Navigation items: `h-5 w-5`.
- ui-context.md: "Lucide React. Stroke-based only. Matches PineForge."

---

## Acceptance Criteria

1. Shell renders on all `(app)` dashboard routes.
2. Sidebar shows all five navigation links with correct icons.
3. Active route is highlighted with `text-neon-400`.
4. Clerk `<UserButton />` renders in the navbar and shows the authenticated user.
5. All `fr-*` utility classes are defined in `globals.css` and match ui-context.md.
6. Three font families (Inter, Syne, Geist Mono) are loaded and applied correctly.
7. Layout is responsive — sidebar hidden on mobile with a toggle button.
8. FinRel wordmark renders with Syne font, `Fin` in zinc-100, `Rel` in neon accent.
9. Dark theme only — no light mode styles or toggle.

---

**Before closing this session:** Update `progress-tracker.md` — move app shell to Completed, note any deviations from ui-context.md if needed.
