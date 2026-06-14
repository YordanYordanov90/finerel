# 08 — API Routes: Settings

**Depends on:** `01-drizzle-schema.md`, `09-auth.md`

---

## Purpose

API route for user settings — specifically briefing time display. Settings are
scoped to the authenticated user and demo mode blocks all mutations.

---

## Files to Create

| Path | Purpose |
|---|---|
| `app/api/settings/route.ts` | `GET` for user settings |

---

## Requirements

### Authentication & Scoping

- Clerk auth required — `userId` from `auth()`.
- All queries filter by `userId` (architecture.md invariant 2).

### GET `/api/settings`

- Returns the authenticated user's settings.
- Response: `{ data: { briefingTime: string } }`
- `briefingTime` is read-only in MVP — displayed but not user-editable
  (project-overview.md: "briefing time preference").

### Demo Mode (from architecture.md invariant 6)

- Architecture.md: "Demo mode (isDemoUser) disables all mutation endpoints —
  read queries only."
- `GET` works normally for demo user.

### Response Shape

- `{ data: T }` on success, `{ error: string }` on failure (code-standards.md).

---

## Acceptance Criteria

1. `GET /api/settings` returns the user's `briefingTime`.
2. Demo user `GET` works normally.
3. Unauthenticated requests return `401`.
4. Response shape follows `{ data }` / `{ error }` pattern.

---

**Before closing this session:** Update `progress-tracker.md` — move settings API routes to Completed.
