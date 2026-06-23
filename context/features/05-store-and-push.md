# 05 — Store Relationships & Email Delivery

**Depends on:** `01-drizzle-schema.md`, `03-fetch-news-tool.md`, `04-extract-relationships.md`

---

## Purpose

Complete the agent pipeline: store extracted relationships in Neon, create a
briefing record, and send the summary to the user via email (Resend). Wire the
full `/cron/morning-briefing` handler end to end.

---

## Files to Create

| Path | Purpose |
|---|---|
| `lib/agent/tools/store-relationships.ts` | Drizzle insert for relationships + briefing record |
| `lib/agent/tools/send-briefing-email.ts` | Resend email send function |
| `app/api/cron/morning-briefing/route.ts` | Update stub → full pipeline: fetch → extract → store → email |

---

## Requirements

### Store Relationships (from architecture.md, code-standards.md)

- Architecture.md invariant 1: "The cron API routes (`app/api/cron/`) are the only
  routes that write relationships and briefings to the database. Other API routes
  are read-only for these entities."
- Every `INSERT` into `relationships` includes `userId` (architecture.md invariant 2).
- Insert validated `ExtractedRelationship[]` from the extraction output.
- Create a `briefings` record after relationships are stored:
  - `userId` from extraction input
  - `summary` from `extractionOutputSchema.summary`
  - `itemsProcessed` from `extractionOutputSchema.itemsProcessed`
  - `relationshipsFound` = length of relationships array
  - `briefingDate` = today's date
- Link each relationship to the briefing via `briefingId`.
- Code-standards.md: "Do not store raw LLM output in the database — always
  persist Zod-validated, typed data."

### Resend Email Setup

- Install and configure the Resend SDK (`resend` npm package).
- `RESEND_API_KEY` read from `process.env.RESEND_API_KEY` — never hardcoded, never logged.
- Architecture.md invariant 3a: "The Resend API key is server-side only, never
  exposed to the client."

### Email Send Function

- Look up user's `email` from the `users` table by `userId` (from Clerk,
  already stored — no user action required).
- Format the briefing email from `extractionOutputSchema.summary`.
- Send a clean, plain-text email with the briefing summary.
- From address: configured via Resend verified domain (e.g. `briefing@finrel.dev`).
- Subject line: "FinRel Morning Briefing — <date>"
- If email send fails, log a warning and continue — do not crash the run.

### End-to-End Pipeline (from architecture.md data flow)

Wire `/cron/morning-briefing` to execute in sequence:

```
1. Verify QStash signature (already done in 02)
2. Query all users with active watchlists
3. For each user:
   a. fetch_watchlist_news (Finnhub, per-user tickers)
   b. extract_relationships (Vercel AI SDK + models.extraction)
   c. store_relationships (Drizzle → Neon)
   d. send_briefing_email (Resend → user's email)
4. Return 200
```

Architecture.md data flow:
```
QStash (09:00 EEST cron)
  → POST /api/cron/morning-briefing (Vercel)
      → Verify QStash signature
      → fetch_watchlist_news (Finnhub, per user)
      → extract_relationships (Vercel AI SDK + models.extraction + Zod)
      → store_relationships (Drizzle → Neon Postgres)
      → generate_briefing_summary
      → send email via Resend
```

### Error Handling (from core-intelligence-spec.md §5, code-standards.md)

- Each step (fetch, extract, store, email) is wrapped in its own try/catch.
- A failed extraction logs the error and continues — the user receives a
  "no new relationships found today" fallback email.
- Code-standards.md: "Tool execution errors are caught and logged — a single
  failed tool call must not crash the entire briefing run."
- A failed email for one user must not prevent processing of other users.

---

## Environment Variables

| Variable | Source |
|---|---|
| `RESEND_API_KEY` | Resend — server-side only, never logged |

---

## Acceptance Criteria

1. A full briefing run completes end to end: fetch → extract → store → email.
2. Relationships appear in the Neon `relationships` table with correct `userId` and `briefingId`.
3. A `briefings` record is created with correct `summary`, `itemsProcessed`, and `relationshipsFound`.
4. Briefing email is received in the user's inbox with the summary text.
5. A failed extraction step does not crash the run — a fallback "no new relationships today" email is sent.
6. A failed email for one user does not prevent processing of remaining users.
7. No raw LLM output is written to the database — only Zod-validated data.
8. `RESEND_API_KEY` is never present in any log output.

---

**Before closing this session:** Update `progress-tracker.md` — move store + email delivery to Completed, and confirm the full pipeline runs end to end.
