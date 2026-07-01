# 26 — Chat API Route (agent loop + persistence)

**Depends on:** `09-auth.md`, `24-chat-schema.md`, `25-chat-tools.md`
**Design spec:** `agent/agent-plan.md` (§3–§7), `agent/chat-schema.md` (lifecycle)

---

## Purpose

The endpoint that runs the agent: a `streamText` tool-calling loop scoped to the
signed-in user, streaming the answer back while loading and saving the thread's
history. This is where features 24 (schema) and 25 (tools) come together. No UI.

---

## Files to Create

| Path | Purpose |
|---|---|
| `app/api/chat/route.ts` | `POST` — the streaming agent loop + thread persistence |
| `lib/models.ts` | Add `models.chat` (extend existing file) |
| `lib/data/chat.ts` | Thread/message helpers: `resolveThreadId`, `loadThreadMessages`, `appendTurn`, `listThreads`, `ChatAccessError` |
| `lib/agent/protect-ai-route.ts` | Auth wrapper — resolves `userId`, returns `401` if absent, passes `userId` to the handler |

---

## Requirements

### Model

- Add `chat` to `lib/models.ts`. Give it a more capable model than
  `extraction`/`briefing` (those are `gpt-4.1-mini`) — chat does multi-tool
  reasoning, not fixed extraction. Selected via the central registry; the route
  never instantiates a provider directly (`architecture.md` invariant).

### Runtime

- `export const maxDuration = 60` — Vercel Hobby ceiling (`agent/chat-ui.md` §2).
  Do not copy the cron route's `300`; Hobby won't honor it.

### Auth & scoping

- Wrap the handler with `protectAiRoute(handler)` — it resolves `userId`
  server-side, returns `401` for unauthenticated requests, and passes `userId` in.
  The route never reads `userId` from the body.
- Build tools with `buildChatTools(userId)` (feature 25) — `userId` is never
  client-supplied and never a tool parameter.
- Thread ownership via `resolveThreadId(userId, requestedThreadId)`: a `threadId`
  owned by **another** user throws `ChatAccessError` → `403`. A `threadId` that
  doesn't exist yet is created for the caller (client-generated thread ids
  allowed), so the panel and page can mint ids client-side.

### The loop (`agent/agent-plan.md` §4)

1. Accept `{ threadId?, id?, message, context? }`. `id` is the useChat-provided
   alias for the thread (`requestedThreadId = threadId ?? id`). If absent, create a
   thread; if present, resolve/verify ownership via `resolveThreadId`.
2. Load the thread's prior messages ordered by `createdAt`; `validateUIMessages`
   the replay + new user message, then `convertToModelMessages` into
   `streamText({ model: models.chat, system, tools, messages })`.
3. Enforce a hard **tool-call step cap** — `stopWhen: stepCountIs(5)` — so a turn
   can't run away.
4. Stream via `toUIMessageStreamResponse`, with `X-Thread-Id` on the response so
   the client learns a newly-minted thread id.
5. For non-demo users, `consumeStream()` so `onFinish` runs even if the client
   disconnects; on finish, persist the user message + assistant reply (full
   `parts`, tool calls included) via `appendTurn` and bump `updatedAt`.
6. `appendTurn` sets the thread `title` from the first user message when still null.

### Page-context seeding (panel only) — feature 27

Supports the docked Ask panel's context awareness (`27-chat-ui.md` →
*Page-context seeding*).

- Accept an **optional** `context` field on the POST body — a small, sanitized
  descriptor of the caller's current view, e.g.
  `{ page: "graph", focus: { ticker: "NVDA" } }`. Validate its shape and **cap its
  size** with Zod; reject oversized/invalid context with `400`.
- Inject it into the model `system` **for that turn only** (e.g. an appended
  "Current view:" line). It frames the question; the agent's tools are unchanged.
- **Ephemeral — never persisted.** Context is request framing, not transcript.
  `appendTurn` still stores only the user + assistant messages, so a resumed
  thread never carries stale view context.
- **Trust boundary (`agent/agent-plan.md` §7):** context is a hint only. `userId`
  still comes from `protectAiRoute`; tools are still `buildChatTools(userId)`.
  Context never sets `userId`, never widens tool scope, never selects a thread.
- The full `/chat` page sends no `context`; panel turns may.

### Boundaries (`agent/agent-plan.md` §7)

- Read-only tools only; the route never sends email or writes domain data — its
  only writes are to `chat_threads` / `chat_messages`.
- On error or step-cap hit, return a graceful message (`onError` →
  "Something went wrong. Please try again.") and save what completed — never a
  fabricated answer (`agent-plan.md` §4).

### Demo mode

- Demo users (`isDemoUser`) stream **read-only**: the response is produced, but
  `consumeStream()` is skipped and `onFinish` persistence is short-circuited — no
  `chat_threads`/`chat_messages` rows are written.

---

## Acceptance Criteria

1. `POST /api/chat` streams an assistant reply token-by-token.
2. Unauthenticated requests get `401`; a `threadId` owned by another user gets `403`.
3. A new conversation creates a `chat_threads` row; subsequent turns append to it. A client-supplied `threadId`/`id` that doesn't exist yet is created for the caller.
4. Prior messages are replayed so the agent has conversation context within the thread.
5. The assistant reply is persisted with full `parts` (tool calls included) and `updatedAt` is bumped; the first user message sets the thread `title`.
6. The tool-step cap (`stepCountIs(5)`) bounds a single turn; a cap hit or stream error returns gracefully.
7. The route writes only to chat tables — no relationships/briefings writes, no email.
8. `models.chat` resolves from `lib/models.ts`.
9. An optional sanitized `context` field is accepted; oversized/invalid context yields `400`.
10. Page context is injected into the turn's `system` only and is **not** written to `chat_messages`.
11. Page context never changes `userId` or tool scope — framing only.
12. Demo users stream with no persistence (no chat rows written).

---

**Before closing this session:** Update `progress-tracker.md` — mark feature 26 done, note `models.chat` and the request/response shape for the UI feature.
