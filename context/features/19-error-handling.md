# 19 — Error Handling

**Depends on:** `10-app-shell.md`, `11-overview-page.md`, `12-graph-page.md`,
`13-briefing-history-page.md`, `14-watchlist-page.md`, `15-settings-page.md`

---

## Purpose

Add proper error boundaries, API error handling, and client-side resilience
so the app never shows a white screen or raw stack trace to users.

---

## High Priority

### 1. Add `error.tsx` boundaries

**Problem:** No `error.tsx` exists anywhere. If a server component throws
(database down, query timeout), the user sees the default Next.js white error
page in production.

**Files to create:**

| Path | Purpose |
|---|---|
| `app/(app)/error.tsx` | Catches all dashboard page errors |
| `app/global-error.tsx` | Catches root layout errors (Clerk init, font loading) |

**Requirements:**

- `app/(app)/error.tsx` — `'use client'` component. Shows:
  - Lucide icon (`AlertTriangle`, `h-8 w-8`, same sizing as empty states).
  - Heading: "Something went wrong"
  - The `error.message` in `text-zinc-400` (but NOT a raw stack trace).
  - A "Try again" button (`fr-cta-btn`) that calls the `reset()` function
    passed by Next.js.
  - Styled with the dark theme — `fr-card` surface, centered layout.

- `app/global-error.tsx` — `'use client'` component. Since this replaces the
  entire `<html>`, it must include its own `<html>` and `<body>` tags with
  the dark background (`bg-[#0a0a0a]`). Shows a minimal error message and
  a "Reload" button that calls `reset()`. Cannot use `fr-*` classes (globals.css
  may not be loaded), so inline the critical styles.

### 2. Add try/catch to all API route database calls

**Problem:** Every API route validates input but has no catch around the
database call. If Drizzle throws (connection reset, query timeout), the
response is a raw 500 with no structured body and no server-side logging.

**Files to modify:**

| Path | What to wrap |
|---|---|
| `app/api/briefings/route.ts` | The `Promise.all` with the two DB queries |
| `app/api/relationships/route.ts` | The `Promise.all` with the two DB queries |
| `app/api/graph/route.ts` | The `getGraphData()` call |
| `app/api/watchlist/route.ts` | GET: the `db.select` query; POST: the `db.select` + `db.insert` sequence |
| `app/api/watchlist/[ticker]/route.ts` | The `db.delete` call |
| `app/api/settings/route.ts` | The `db.select` call |

**Pattern for each route:**

```ts
try {
  // existing DB logic
} catch (error) {
  console.error("[api/ROUTE_NAME] database error", {
    error: error instanceof Error ? error.message : "unknown",
  });
  return Response.json(
    { error: "Internal server error" },
    { status: 500 },
  );
}
```

- Log the real error with `console.error` for observability.
- Return `{ error: "Internal server error" }` — never expose the raw
  error message to the client.
- Use the route name in the log prefix so errors are searchable
  (e.g., `[api/briefings]`, `[api/graph]`).

### 3. Protect `getGraphData` in the graph server component

**Problem:** `app/(app)/graph/page.tsx:16` calls `getGraphData(userId)` with
no error handling. Two parallel DB queries with no catch — if either fails,
the page crashes. The `error.tsx` from item 1 would catch this, but only if
it exists.

**File to modify:** `app/(app)/graph/page.tsx`

This is covered by the `error.tsx` boundary from item 1 — no additional
try/catch needed in the server component itself. The boundary catches it.
Same applies to `overview/page.tsx` and `settings/page.tsx`.

**Verification:** After adding `error.tsx`, confirm that a simulated DB
failure on the graph page shows the error boundary, not a white screen.

---

## Medium Priority

### 4. Handle non-JSON responses in client fetch helpers

**Problem:** `parseResponse()` in both `lib/utils/watchlist-api.ts` and
`lib/utils/history-api.ts` calls `response.json()` directly. If the server
returns a non-JSON response (502 HTML from a proxy, network timeout returning
an HTML error page), `response.json()` throws with a confusing parse error
like `"Unexpected token < in JSON"` — which gets shown to the user as-is.

**Files to modify:**

| Path | Function |
|---|---|
| `lib/utils/watchlist-api.ts` | `parseResponse()` |
| `lib/utils/history-api.ts` | `parseResponse()` |

**Fix:** Wrap `response.json()` in a try/catch inside `parseResponse()`:

```ts
async function parseResponse<T>(response: Response): Promise<T> {
  let body: unknown;

  try {
    body = await response.json();
  } catch {
    throw new Error("Server error — please try again");
  }

  if (!response.ok) {
    const message =
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof (body as { error: unknown }).error === "string"
        ? (body as { error: string }).error
        : "Request failed";
    throw new Error(message);
  }

  return body as T;
}
```

### 5. Add `not-found.tsx` for custom 404

**Problem:** No `not-found.tsx` exists. Users navigating to a non-existent
route see the default Next.js 404 page which doesn't match the dark theme.

**Files to create:**

| Path | Purpose |
|---|---|
| `app/not-found.tsx` | Global 404 page |

**Requirements:**

- Dark background matching the app theme.
- Lucide icon (`FileQuestion` or `SearchX`, `h-8 w-8`).
- Heading: "Page not found"
- Subtext: "The page you're looking for doesn't exist."
- Link back to `/` — "Go to overview".
- Uses `fr-card` surface, centered layout, same pattern as empty states.

### 6. Protect the Clerk webhook DB insert

**Problem:** `app/api/webhooks/clerk/route.ts:34` — the `db.insert(users)`
call has no try/catch. If the insert fails for a reason not covered by
`onConflictDoNothing` (e.g., connection error, unexpected constraint
violation), Clerk gets a raw 500.

**File to modify:** `app/api/webhooks/clerk/route.ts`

**Fix:** Wrap the insert in try/catch, log the error, return 500 with
a structured body. Clerk will retry on failure, so the log is important
for debugging repeated failures.

---

## Low Priority

### 7. Add pagination safety to `fetchAllRelationships`

**Problem:** `lib/utils/watchlist-api.ts:88-101` uses a `do...while` loop
to fetch all relationships with no iteration limit. If the API returns an
unexpected response or `total` keeps changing, this loops indefinitely.

**File to modify:** `lib/utils/watchlist-api.ts`

**Fix:** Add a `MAX_PAGES` constant (e.g., 50) and break the loop if
exceeded:

```ts
const MAX_PAGES = 50;
let page = 0;

do {
  // existing fetch logic
  page += 1;
  if (page >= MAX_PAGES) break;
} while (offset < total);
```

### 8. Add retry buttons to client-side error states

**Problem:** When `TickerList` or `BriefingTable` fail to load, the error
is shown but there's no way for the user to retry without refreshing the
entire page.

**Files to modify:**

| Path | Component |
|---|---|
| `components/watchlist/TickerList.tsx` | Error state block |
| `components/history/BriefingTable.tsx` | Error state block |
| `components/history/BriefingRow.tsx` | Error state in expanded view |

**Fix:** Add a "Retry" button next to each error message that calls the
existing `loadWatchlist()` / `loadBriefings(0, false)` / re-triggers the
useEffect. Use `variant="outline"` button styled with `border-zinc-800`.

### 9. Distinguish demo-not-configured from unauthorized

**Problem:** `lib/auth.ts:22-29` — `getAuthOrDemoUserId` returns `null`
when `DEMO_USER_ID` env var isn't set and `?demo=true` is passed. The API
routes then return a generic 401 "Unauthorized". Demo pages would show the
same error as a genuinely unauthenticated user.

**File to modify:** `lib/auth.ts`

**Fix:** When `demo=true` is passed but `DEMO_USER_ID` is not set, the
API could return a more specific error. However, this is low impact since
the demo env var should always be set in deployed environments. Consider
logging a warning server-side instead of changing the response.

---

## Acceptance Criteria

### High
1. `app/(app)/error.tsx` renders a styled error page with "Try again" button
   for any dashboard server component failure.
2. `app/global-error.tsx` renders a minimal error page for root layout failures.
3. All API routes return `{ error: "Internal server error" }` with status 500
   on database failures, never raw stack traces.
4. All API route database errors are logged with `console.error` and include
   the route name prefix.

### Medium
5. `parseResponse()` in both client helpers handles non-JSON responses
   gracefully with a user-friendly message.
6. `app/not-found.tsx` shows a themed 404 page matching the dark design.
7. Clerk webhook DB insert failure is caught and logged.

### Low
8. `fetchAllRelationships` loop has a max-iteration guard.
9. Error states in `TickerList`, `BriefingTable`, and `BriefingRow` include
   a "Retry" button.
10. Demo auth returns a distinct message when `DEMO_USER_ID` is not configured.

---

**Before closing this session:** Update `progress-tracker.md` — move error
handling to Completed, noting which priority level was addressed.
