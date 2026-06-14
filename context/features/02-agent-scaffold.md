# 02 — Agent Scaffold (Vercel)

**Depends on:** `01-drizzle-schema.md`

---

## Purpose

Create the Vercel-hosted agent entry point with QStash signature verification
and a stubbed `/api/cron/morning-briefing` route. This is the skeleton that all
agent tools (fetch, extract, store, push) plug into.

---

## Files to Create

| Path | Purpose |
|---|---|
| `app/api/cron/morning-briefing/route.ts` | QStash-triggered cron handler (stub) |
| `app/api/health/route.ts` | `GET /api/health` endpoint |
| `lib/agent/verify-qstash.ts` | QStash `Receiver` signature verification helper |
| `lib/agent/env.ts` | Startup environment variable validation |

---

## Requirements

### Environment Validation (from architecture.md, code-standards.md)

`lib/agent/env.ts` exports a validated env object — import it in any module
that needs secrets. Throws at import time if any variable is missing:

| Variable | Source |
|---|---|
| `OPENAI_API_KEY` | OpenAI — platform key, never logged (architecture.md invariant 3) |
| `QSTASH_CURRENT_SIGNING_KEY` | Upstash QStash — for signature verification |
| `QSTASH_NEXT_SIGNING_KEY` | Upstash QStash — key rotation support |
| `FINNHUB_API_KEY` | Finnhub — server-side only, never logged (code-standards.md) |
| `RESEND_API_KEY` | Resend — server-side only, never logged (architecture.md invariant 3a) |
| `DATABASE_URL` | Neon Postgres connection string |

Use Zod to validate the env object — consistent with the project pattern of
"validate all external input with Zod" (code-standards.md).

### QStash Verification (from architecture.md invariant 4)

- Use `@upstash/qstash` `Receiver` class.
- Helper in `lib/agent/verify-qstash.ts` verifies the `Upstash-Signature` header.
- Called at the top of every `/api/cron/*` route — reject with **401** before any handler logic runs.
- Architecture.md: "QStash signature verification must pass before any cron
  handler executes any work — reject unsigned requests with 401 immediately."

### Routes

#### `POST /api/cron/morning-briefing`

- Next.js App Router API route (`app/api/cron/morning-briefing/route.ts`).
- Protected by QStash verification at the top of the handler.
- Stub implementation: logs receipt with timestamp, returns `200 { ok: true }`.
- No business logic yet — tools are wired in `05-store-and-push.md`.

#### `GET /api/health`

- No auth required.
- Returns `200 { status: 'ok', timestamp: <ISO string> }`.

### Vercel Function Configuration

- Node.js runtime (default Vercel Functions behavior).
- The cron route may need `maxDuration` configured if the full pipeline exceeds
  the default timeout (architecture.md: use Vercel Fluid Compute defaults).
- No Docker, no separate server process — runs as standard Vercel Functions.

---

## Acceptance Criteria

1. `npm run build` compiles with zero errors.
2. `GET /api/health` returns `200 { status: 'ok' }`.
3. `POST /api/cron/morning-briefing` **without** a valid QStash signature returns `401`.
4. `POST /api/cron/morning-briefing` **with** a valid QStash signature returns `200`.
5. Missing any one of the six required env vars causes an immediate error with a clear message naming the missing variable.
6. No Express server, no Dockerfile, no separate `agent/` service directory.

---

**Before closing this session:** Update `progress-tracker.md` — move agent scaffold to Completed, note the route paths.
