# 16 — Landing Page

**Depends on:** `09-auth.md` (for routing: demo vs auth)

---

## Purpose

Public marketing page — communicate the product value, link to the demo
dashboard, and drive signups. First impression for visitors and potential
employers reviewing the portfolio.

---

## Files to Create

| Path | Purpose |
|---|---|
| `app/(landing)/layout.tsx` | Landing layout — no sidebar, no auth shell |
| `app/(landing)/page.tsx` | Landing page content |
| `components/landing/Hero.tsx` | Hero section |
| `components/landing/HowItWorks.tsx` | 3-step explanation section |
| `components/landing/LandingNavbar.tsx` | Public navbar (no auth controls) |

---

## Requirements

### Routing

- Public route — no auth required (defined in `09-auth.md` middleware).
- Uses a `(landing)` route group with its own layout (no sidebar).
- Project-overview.md success criterion: "A first-time visitor understands the
  product and explores the demo in under 2 minutes."

### Hero Section (from ui-context.md)

- Product name: **FinRel**.
- One-line value proposition: communicates "AI-powered financial relationship
  intelligence for your watchlist" or similar.
- Two CTAs:
  - "See it live" → links to demo dashboard (`/demo` or app shell with demo user)
  - "Get started" → links to Clerk signup
- Neon accent (`#c8ff00`) on primary CTA — `fr-cta-btn` utility.
- ui-context.md: "Landing hero: Syne, text-3xl → text-6xl, responsive hero headline."
- Syne font for hero headline (`font-heading`).
- Inter for body text (`font-sans`).

### Background (from ui-context.md)

- `fr-page` background: `bg-[#0a0a0a]` + neon radial glow.
- ui-context.md: "Root page background (#0a0a0a) + neon radial glow (.fr-page)."

### How It Works Section

Three steps (from project-overview.md core user flow):
1. **Add your watchlist** — "Pick the tickers you want to track."
2. **Agent monitors daily** — "Every morning, FinRel scans news for inter-company relationships."
3. **Review in your dashboard** — "Explore the relationship graph, briefing history, and more."

### Navbar (from ui-context.md)

- ui-context.md: "Landing wraps ticker + navbar inside a single sticky top-0 z-50
  container. Background bg-zinc-950/80 backdrop-blur-md."
- No auth controls on the public navbar — just logo + CTA links.

### Layout Constraints (from ui-context.md)

- Max width: `max-w-7xl mx-auto px-6`.
- `overflow-x-clip` on page shell (not `overflow-x-hidden`).
- ui-context.md: "Use overflow-x-clip (not overflow-x-hidden) on page shell."

### No Auth UI

- This page has no Clerk `<UserButton />` or sign-in controls in the navbar.
- Sign-in is only via the "Get started" CTA which links to Clerk's hosted or
  modal sign-up flow.

---

## Acceptance Criteria

1. Page loads without authentication.
2. "See it live" CTA links to the demo dashboard.
3. "Get started" CTA links to Clerk signup.
4. Hero headline uses Syne font (`font-heading`).
5. Hero communicates the product value proposition in under 10 seconds of reading.
6. `fr-page` background with neon radial glow is applied.
7. How-it-works section shows three clear steps.
8. Page uses `max-w-7xl` max width and `overflow-x-clip`.
9. No sidebar, no app shell — standalone landing layout.
10. Consistent with the `fr-*` design token system from ui-context.md.

---

**Before closing this session:** Update `progress-tracker.md` — move landing page to Completed.
