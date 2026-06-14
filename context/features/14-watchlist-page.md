# 14 — Watchlist Page

**Depends on:** `06-api-routes-watchlist.md`, `10-app-shell.md`

---

## Purpose

Manage the user's stock ticker watchlist — add, remove, and view activity
per ticker.

---

## Files to Create

| Path | Purpose |
|---|---|
| `app/(app)/watchlist/page.tsx` | Watchlist management page |
| `components/watchlist/TickerList.tsx` | List of current tickers with activity summary (`'use client'`) |
| `components/watchlist/AddTickerInput.tsx` | Add ticker form input (`'use client'`) |

---

## Requirements

### Data Source

- Current tickers from `GET /api/watchlist`.
- Activity data (relationship count, last seen date) derived from
  `GET /api/relationships` filtered per ticker.

### Ticker List

- Each ticker row shows:
  - Ticker symbol in `font-mono text-neon-300/95` pill style (ui-context.md).
  - Relationship count (how many relationships involve this ticker).
  - Last activity date.
  - Remove button (trash icon, `h-4 w-4` per ui-context.md).

### Add Ticker

- Text input with uppercase enforcement (transform to uppercase on input).
- Validated: 1–5 chars, letters only.
- `POST /api/watchlist` on submit.
- Shows error toast on invalid format or duplicate.
- Code-standards.md: "Display user-friendly error messages via toast."

### Remove Ticker

- Confirmation before removal (simple confirm dialog or inline confirm).
- `DELETE /api/watchlist/[ticker]` on confirm.
- Optimistic UI update or refetch after removal.

### Demo Mode

- Architecture.md invariant 6: "Demo mode (isDemoUser) disables all mutation
  endpoints — read queries only."
- Add and remove controls hidden or disabled for demo user.
- Show a note: "Demo account — watchlist is read-only."

---

## Acceptance Criteria

1. Watchlist renders with all user tickers and activity summaries.
2. Add ticker input enforces uppercase and validates format.
3. Adding a valid ticker succeeds and appears in the list.
4. Adding a duplicate or invalid ticker shows an error toast.
5. Remove ticker works with confirmation.
6. Demo user sees read-only state — add/remove controls disabled with explanation.
7. Ticker symbols use `font-mono` neon pill styling.

---

**Before closing this session:** Update `progress-tracker.md` — move watchlist page to Completed.
