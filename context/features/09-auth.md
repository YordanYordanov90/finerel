# 09 — Clerk Authentication & Demo Mode

**Depends on:** `01-drizzle-schema.md`

---

## Purpose

Set up Clerk authentication for the Next.js dashboard, define public vs
protected routes, implement the demo mode detection helper, and handle the
Clerk webhook for new user onboarding.

---

## Files to Create

| Path | Purpose |
|---|---|
| `proxy.ts` | Next.js proxy with Clerk auth |
| `lib/auth.ts` | `isDemoUser()` helper and auth utility functions |
| `app/api/webhooks/clerk/route.ts` | Clerk webhook handler for `user.created` |
| `.env.local` update | Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `DEMO_USER_ID` |

---

## Requirements

### Clerk Installation

- `@clerk/nextjs` package.
- `ClerkProvider` wrapping the root layout.
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` in environment.

### Proxy (from code-standards.md, project-overview.md)

- Public routes (no auth required):
  - `/` — landing page
  - `/demo` — demo dashboard entry
  - `/api/health` — health check
  - `/api/webhooks/clerk` — webhook endpoint
- All other routes require authentication.
- Code-standards.md: "Keep route handlers focused on a single responsibility."
- Use Clerk's `clerkMiddleware` with `createRouteMatcher` for public routes.

### userId Extraction Pattern

- Always from `auth()` server-side in route handlers.
- Always from `currentUser()` or `auth()` in server components.
- Never from request body, query params, or client-sent headers.
- Code-standards.md: "Demo mode is detected server-side via Clerk userId
  comparison — never trust a client-sent isDemo flag."

### Demo Mode (from architecture.md, code-standards.md)

- `DEMO_USER_ID` environment variable on Vercel — the Clerk `userId` of the
  pre-seeded demo account.
- `lib/auth.ts` exports:
  ```ts
  export function isDemoUser(userId: string): boolean {
    return userId === process.env.DEMO_USER_ID
  }
  ```
- Architecture.md invariant 6: "Demo mode (isDemoUser) disables all mutation
  endpoints — read queries only."
- Architecture.md: "Demo mode: a pre-seeded read-only Clerk account with fixed
  userId. Dashboard detects demo mode via a flag and disables all mutation operations."
- Code-standards.md: "Demo mode is detected server-side via Clerk userId comparison
  — never trust a client-sent isDemo flag."

### Clerk Webhook (from project-overview.md)

- `POST /api/webhooks/clerk` handles `user.created` events.
- On `user.created`:
  1. Validate the webhook signature (Clerk's `verifyWebhook` or Svix verification).
  2. Insert a new row into the `users` table with the Clerk `userId` and email.
  3. Seed a default empty watchlist (the user will add tickers via the dashboard).
- Validate the webhook body with Zod before processing.
- Return `200` on success, `400` on invalid payload.

### Security

- Webhook endpoint must verify the Clerk/Svix signature before processing
  (code-standards.md: "Validate all external input at system boundaries using Zod").
- `CLERK_SECRET_KEY` is server-side only — never referenced in client components.
- Architecture.md invariant 3 pattern: secrets are never sent to the client,
  logged, or included in responses.

---

## Acceptance Criteria

1. Unauthenticated requests to protected routes redirect to Clerk sign-in.
2. Public routes (`/`, `/demo`, `/api/health`, `/api/webhooks/clerk`) are accessible without auth.
3. `isDemoUser()` correctly identifies the demo `userId` from `DEMO_USER_ID` env var.
4. `isDemoUser()` returns `false` for any other `userId`.
5. Clerk `user.created` webhook creates a `users` row and empty watchlist.
6. Webhook rejects invalid or unsigned payloads with `400`.
7. `auth()` returns `userId` in all protected route handlers.
8. No Clerk secret key is referenced in any client component.

---

**Before closing this session:** Update `progress-tracker.md` — move Clerk auth to Completed, record the Clerk app name and the public route list.
