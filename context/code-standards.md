# Code Standards

## General

- Keep modules small and single-purpose — one file, one clear responsibility.
- Fix root causes; do not layer workarounds on top of broken behavior.
- Do not mix unrelated concerns in one component or route handler.
- Prefer explicit over implicit — name things by what they do, not where they live.
- Security is a first-class concern, not an afterthought. Apply it at the boundary, not the caller.

## TypeScript

- Strict mode is required throughout (`"strict": true` in tsconfig).
- Never use `any`. Use explicit interfaces, `unknown` with narrowing, or Zod-inferred types.
- Validate all external input at system boundaries using Zod before trusting it — this includes Finnhub API responses, QStash payloads, LLM outputs, and Clerk webhook bodies.
- Use `z.infer<typeof schema>` to derive TypeScript types from Zod schemas — do not duplicate type definitions.

## Next.js (App Router)

- Default to Server Components. Add `"use client"` only when browser interactivity requires it.
- Keep route handlers focused on a single responsibility — no handler does both auth and business logic in one block.
- AI extraction work runs in dedicated cron API routes (`app/api/cron/`) with `maxDuration` configured as needed.
- Use `next/headers` for cookie and header access in server components — never access `request` directly in components.
- Demo mode is detected server-side via Clerk `userId` comparison — never trust a client-sent `isDemo` flag.

## Styling

- Use CSS custom property tokens defined in `ui-context.md` — no hardcoded hex values anywhere.
- Tailwind utility classes only — no custom CSS files except for the token definitions in `globals.css`.
- Follow the border radius and spacing scale from `ui-context.md` consistently.
- `components/ui/` is shadcn-generated. Add components via the CLI, never edit them by hand.

## API Routes

- Validate and parse all request input with Zod before any logic runs — return 400 with a clear message on failure.
- Enforce Clerk auth and `userId` ownership check before any read or mutation.
- Every route returns a consistent shape: `{ data: T }` on success, `{ error: string }` on failure.
- Never return stack traces or internal error messages to the client.
- Log errors server-side with enough context to debug, but sanitize before any external output.

## Agent (Cron API Routes)

- QStash signature verification is the first line of every cron handler — reject with 401 before any work runs.
- All tool inputs and outputs are validated with Zod schemas — `lib/schemas/` is the single source of truth.
- Use Vercel AI SDK `generateObject` for all LLM calls — never call the OpenAI SDK directly.
- Import model references from `lib/models.ts` — never instantiate `openai()` or any provider in tool files. All model selection lives in one place.
- The OpenAI API key is read from `process.env.OPENAI_API_KEY` — never hardcoded, never logged.
- Tool execution errors are caught and logged — a single failed tool call must not crash the entire briefing run.
- Keep the agent loop deliberately small: fetch → extract → store → push. No speculative extra steps.

## Data and Storage

- Every Drizzle query includes a `userId` filter — no exceptions.
- `relationships` and `briefings` are written only by cron API routes — other API routes never insert into these tables.
- Do not store raw LLM output in the database — always persist Zod-validated, typed data.
- Raw article content is not stored — only `headline`, `summary`, `url`, `source`, `published_at`, and a `raw_content_hash` for deduplication.
- Use Drizzle migrations for all schema changes — never mutate the database schema directly.

## Secrets and Environment Variables

- All secrets live in Vercel environment variables.
- Use separate OpenAI API keys per project.
- Never log environment variables, API keys, or user tokens — not even partially.
- The Finnhub API key is server-side only — never referenced in client components or exposed in API responses.

## File Organization

- `app/api/cron/` — QStash-triggered cron routes (morning briefing pipeline).
- `lib/agent/` — Agent infrastructure: QStash verification, env validation, tool implementations.
- `lib/agent/tools/` — One file per tool (`fetch-watchlist-news.ts`, `extract-relationships.ts`, `briefing-email-template.ts`, etc.).
- `lib/data/` — Static bundled data (e.g. `tickers.ts` — ~250 major US tickers with `searchTickers()` helper).
- `lib/utils/` — Client-side fetch helpers per domain (`watchlist-api.ts`, `news-api.ts`, `history-api.ts`).
- `app/` — Next.js App Router pages and layouts.
- `app/api/` — API route handlers (read-only for relationships/briefings).
- `lib/db/` — Drizzle schema, migrations, and typed query helpers.
- `lib/models.ts` — Centralized AI model configuration. One entry per tool role (`extraction`, `briefing`, `verification`).
- `lib/schemas/` — All Zod schemas. Shared between agent and app — import from here, never redefine inline.
- `components/` — Shared React components.
- `components/ui/` — shadcn-generated. CLI only. Do not edit.
- `context/` — This folder. AI workflow context files. Keep in sync with implementation.

