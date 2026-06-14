# 06 — API Routes: Watchlist

**Depends on:** `01-drizzle-schema.md`, `09-auth.md`

---

## Purpose

CRUD API routes for managing a user's stock watchlist. These are the only
mutation routes in the Next.js app (relationships and briefings are written
exclusively by the cron API routes per architecture.md invariant 1).

---

## Files to Create

| Path | Purpose |
|---|---|
| `app/api/watchlist/route.ts` | `GET` (list) and `POST` (add ticker) |
| `app/api/watchlist/[ticker]/route.ts` | `DELETE` (remove ticker) |
| `lib/schemas/watchlist.ts` | Zod validation schemas for watchlist operations |

---

## Requirements

### Authentication (from code-standards.md, architecture.md)

- All routes require Clerk auth — `auth()` from `@clerk/nextjs/server`.
- `userId` is always extracted from `auth()` server-side, never from the request
  body or query params (code-standards.md: "Enforce Clerk auth and userId
  ownership check before any read or mutation").
- Unauthenticated requests return `401 { error: 'Unauthorized' }`.

### GET `/api/watchlist`

- Returns the authenticated user's watchlist tickers.
- Query: `SELECT * FROM watchlists WHERE userId = :userId ORDER BY addedAt DESC`
- Architecture.md invariant 2: "Every database query filters by userId."
- Response: `{ data: { tickers: [{ ticker, addedAt }] } }`

### POST `/api/watchlist`

- Adds a ticker to the user's watchlist.
- Request body validated with Zod:
  ```ts
  z.object({
    ticker: z.string().min(1).max(5).transform(v => v.toUpperCase())
  })
  ```
- Check for duplicate: if `(userId, ticker)` already exists, return
  `400 { error: 'Ticker already in watchlist' }`.
- On success: `201 { data: { ticker, addedAt } }`
- Invalid input (empty, >5 chars, non-string): `400 { error: '<Zod message>' }`

### DELETE `/api/watchlist/[ticker]`

- Removes a ticker from the user's watchlist.
- Enforce ownership: only delete if the row belongs to the authenticated `userId`
  (AGENTS.md review guidelines: "Ownership checks enforced on every PATCH and
  DELETE route").
- If ticker not found for this user: `404 { error: 'Ticker not found in watchlist' }`
- On success: `200 { data: { ticker, removed: true } }`

### Response Shape (from code-standards.md)

- Every route returns `{ data: T }` on success, `{ error: string }` on failure.
- Never return stack traces or internal error messages to the client.
- Code-standards.md: "Every route returns a consistent shape: { data: T } on
  success, { error: string } on failure."

### Demo Mode

- Demo user (`isDemoUser()` from `lib/auth.ts`) cannot add or remove tickers.
- POST and DELETE return `403 { error: 'Demo account is read-only' }` for demo user.
- Architecture.md invariant 6: "Demo mode (isDemoUser) disables all mutation
  endpoints — read queries only."

---

## Acceptance Criteria

1. `GET /api/watchlist` returns the authenticated user's tickers.
2. `POST /api/watchlist` adds a ticker and returns `201`.
3. `POST /api/watchlist` rejects duplicate tickers with `400`.
4. `POST /api/watchlist` rejects invalid formats (empty, >5 chars) with `400`.
5. `DELETE /api/watchlist/[ticker]` removes a ticker and returns `200`.
6. `DELETE /api/watchlist/[ticker]` returns `404` for a ticker not owned by the user.
7. All routes return `401` for unauthenticated requests.
8. Demo user receives `403` on POST and DELETE.
9. All responses follow the `{ data }` / `{ error }` shape.

---

**Before closing this session:** Update `progress-tracker.md` — move watchlist API routes to Completed.
