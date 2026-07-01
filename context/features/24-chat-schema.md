# 24 — Chat Persistence Schema

**Depends on:** `01-drizzle-schema.md`
**Design spec:** `agent/chat-schema.md` (source of truth for this feature)

---

## Purpose

Add the two tables that persist chat conversations so a user can leave and return
to a thread with full history, and so the agent can replay that history as context
each turn. This is the **only** memory layer in v1 — no durable user facts, no
semantic recall (`agent/agent-plan.md` §6, §8).

Schema only. No tools, no route, no UI.

---

## Files to Create

| Path | Purpose |
|---|---|
| `lib/db/schema.ts` | Add `chat_threads` + `chat_messages` tables and their relations (extend existing file) |
| `lib/db/migrations/*` | Generated migration (drizzle-kit) |

---

## Requirements

### Imports

- Add `jsonb` to the existing `drizzle-orm/pg-core` import in `schema.ts`.

### `chat_threads`

| Column | Type | Notes |
|---|---|---|
| `id` | `text` PK | App-generated UUID. Text (not `serial`) so it matches AI SDK string ids and never exposes a sequential thread count. |
| `userId` | `text` not null | FK → `users.id`. Owner — every query filters on this. |
| `title` | `text` nullable | Human label; null until derived from the first exchange. |
| `createdAt` | `timestamp` default `now()` not null | |
| `updatedAt` | `timestamp` default `now()` not null | Bumped on each new message for recency sort. |

**Index:** `idx_chat_threads_user_updated` on `(userId, updatedAt)`.

### `chat_messages`

| Column | Type | Notes |
|---|---|---|
| `id` | `text` PK | The AI SDK message id, stored as-is. |
| `threadId` | `text` not null | FK → `chat_threads.id`, **`onDelete: "cascade"`**. |
| `role` | `text` not null | `user` \| `assistant` \| `system` — denormalized from `parts`. |
| `parts` | `jsonb` not null | Full AI SDK `UIMessage.parts` (text + tool calls + tool results) so the transcript replays faithfully. |
| `createdAt` | `timestamp` default `now()` not null | Orders the transcript. |

**Index:** `idx_chat_messages_thread_created` on `(threadId, createdAt)`.

### Relations

- Declare Drizzle relations: `chat_threads` → many `chat_messages`, so a thread
  load can pull ordered messages in one query.

### Migration

- `npx drizzle-kit generate` → new migration in `lib/db/migrations/` (tracked in
  git, per `code-standards.md`).
- `npx drizzle-kit migrate` to apply. New tables only — no backfill.

---

## Acceptance Criteria

1. `npx drizzle-kit generate` produces a clean migration with no errors.
2. `npx drizzle-kit migrate` applies successfully against Neon.
3. Both `chat_threads` and `chat_messages` exist with the columns above.
4. `chat_messages.threadId` FK cascades — deleting a thread removes its messages.
5. Both indexes exist.
6. `parts` is `jsonb` and round-trips a structured AI SDK message unchanged.
7. No existing table or query is altered beyond the `jsonb` import.

---

**Before closing this session:** Update `progress-tracker.md` — mark feature 24 done, note the migration file path.
