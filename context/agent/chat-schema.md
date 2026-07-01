# Chat Agent — Persistence Schema

**Status:** Design
**Last updated:** June 29, 2026
**Backbone:** `agent-plan.md` (§6 Memory). This doc specifies the v1 memory
layer: conversation persistence only.
**Sibling docs:** `chat-tools.md`, `chat-ui.md`.

---

## 1. Purpose

Persist conversations so a user can leave the chat and come back to a thread with
its full history intact, and so the agent can replay that history as context each
turn (see `agent-plan.md` §6 — the agent is stateless; persistence + replay is
what creates memory).

Two tables, both `userId`-scoped, mirroring the conventions already in
`lib/db/schema.ts`. No durable user-fact memory and no semantic recall — those are
explicitly deferred (`agent-plan.md` §8).

---

## 2. Tables

### `chat_threads`

One row per conversation.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `text` PK | App-generated UUID. Text (not `serial`) so it matches the AI SDK's string message/thread ids and never exposes a sequential thread count. |
| `userId` | `text` notNull | FK → `users.id`. Owner. Every query filters on this. |
| `title` | `text` nullable | Human label. Null until derived (e.g. from the first user message); the UI shows a placeholder until then. |
| `createdAt` | `timestamp` notNull | `defaultNow()`. |
| `updatedAt` | `timestamp` notNull | `defaultNow()`. Bumped on each new message so the thread list can sort by recency. |

**Index:** `(userId, updatedAt)` — list a user's threads, most-recent first.

### `chat_messages`

One row per message in a thread.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `text` PK | The AI SDK message id, stored as-is (no remap). |
| `threadId` | `text` notNull | FK → `chat_threads.id`, **on delete cascade** — deleting a thread removes its messages. |
| `role` | `text` notNull | `user` \| `assistant` \| `system`. Denormalized from `parts` for cheap filtering/rendering. |
| `parts` | `jsonb` notNull | The full structured message (AI SDK `UIMessage.parts`: text, tool calls, tool results). Stored whole so the transcript replays faithfully, including which tools ran. Requires adding `jsonb` to the `pg-core` imports in `schema.ts`. |
| `createdAt` | `timestamp` notNull | `defaultNow()`. Orders the transcript. |

**Index:** `(threadId, createdAt)` — load one thread's messages in order.

**Drizzle relations:** declare `chat_threads` → many `chat_messages` so the thread
load can pull messages in one query.

---

## 3. Ownership and scoping

- A thread is reachable only through its owner's `userId`. Message access is
  always gated by first resolving the thread and checking `userId` — never query
  `chat_messages` by `threadId` alone from a request.
- The `userId` comes from the authenticated session server-side (same
  `getAuthOrDemoUserId` / Clerk `auth()` pattern as existing routes). It is never
  a client-supplied value.
- Cascade delete keeps the two tables consistent: removing a thread removes its
  messages in one operation.

---

## 4. Lifecycle

1. **New conversation** — insert a `chat_threads` row (title null).
2. **Each turn** — load the thread's messages ordered by `createdAt`, replay them
   to the agent, then insert the new user message and the assistant's reply;
   bump the thread's `updatedAt`.
3. **First reply** — optionally derive and set `title` from the opening exchange.
4. **Resume** — on revisit, the UI loads threads by `(userId, updatedAt)` and the
   selected thread's messages by `(threadId, createdAt)`.

---

## 5. Migration

New tables only — no data migration, no backfill. Generated and applied with the
project's existing Drizzle workflow (`drizzle-kit`). Adding `jsonb` to the
`pg-core` import is the only change to existing schema code.

---

## 6. Out of scope (deferred)

- **Durable user memory** — cross-thread facts, preferences, holdings. Would be a
  separate `user_memories` table; not part of v1.
- **Context-window management** — once a thread grows past what fits in one model
  call, older messages need truncation or summarization. Storage for a rolling
  summary would live here when that day comes; v1 replays the full transcript.
- **Semantic recall / embeddings** over past messages.
