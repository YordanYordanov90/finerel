# Chat Agent — Chat Surface (UI)

**Status:** Design
**Last updated:** June 29, 2026
**Backbone:** `agent-plan.md` (§3 Where it lives). Visual language: `../ui-context.md`.
**Sibling docs:** `chat-schema.md`, `chat-tools.md`.

---

## 1. Purpose

The in-app surface where the user talks to the Watchlist Agent. Lives inside the
authenticated dashboard shell, streams answers token-by-token, and loads prior
conversation history on return (per `chat-schema.md`).

---

## 2. Route and entry point

- **Page:** `app/(app)/chat/page.tsx`, inside the existing `(app)` route group so
  it inherits auth and the dashboard shell.
- **Nav:** a `Chat` item in `components/AppSidebar.tsx` (Lucide `MessageSquare`,
  `h-5 w-5`, active state `text-cyan-400`) — same pattern as the existing News
  entry.
- **Backend:** posts to `app/api/chat/route.ts` (the `streamText` loop from
  `chat-tools.md`). Set `export const maxDuration = 60` to stay within the Vercel
  Hobby ceiling; pair with the agent's tool-step cap.

---

## 3. Components — shadcn chat primitives

Install with `npx shadcn@latest add message` (project convention, `../ui-context.md`).
This provides:

| Component | Role |
| --- | --- |
| `Message` (+ `MessageAvatar`, `MessageContent`, `MessageHeader`, `MessageFooter`) | A single message row, with `align="start"` (assistant) / `align="end"` (user). |
| `Bubble` (+ `BubbleContent`) | The visible message surface inside a `Message`. |
| `MessageScroller` | Scroll container around the thread — use instead of wrapping messages directly. |
| `MessageGroup` | Stacks consecutive messages from the same sender. |

**Not provided by shadcn — compose from existing primitives:**

- **Prompt input** — there is no shadcn prompt-input component. Build it from
  `Textarea` + `Button`: auto-grow textarea, Enter to send / Shift+Enter for
  newline, send button disabled while a turn is streaming.
- **Conversation container** — `MessageScroller` is the scroll region; the page
  composes thread list + scroller + prompt input.

**Client glue:** the AI SDK `useChat` hook drives state — streamed assistant
tokens, message list, loading/error status — posting to `/api/chat`.

---

## 4. Layout

Within the dashboard shell (240px sidebar + main content):

- **Conversation pane** — `MessageScroller` filling available height, auto-scrolls
  to the latest message on new tokens. Sticky **prompt input** pinned to the
  bottom.
- **Thread switcher** — list of the user's threads (newest first, from
  `chat_threads` by `(userId, updatedAt)`). v1 can keep this lightweight: a panel
  or dropdown with thread titles + "New chat." Selecting a thread loads its
  messages (`chat-schema.md` §4).

---

## 5. Visual language (`../ui-context.md`)

- **User messages** — `align="end"`, cyan-tinted bubble (`bg-cyan-500/10`,
  `border-cyan-500/40`), `text-zinc-100`.
- **Assistant messages** — `align="start"`, zinc surface bubble (`bg-[#111111]`,
  `border-zinc-800`).
- **Markdown** — assistant content renders as markdown (lists, links, emphasis)
  with a streaming-friendly renderer; the bubble is just the container.
- **Tickers in messages** — always the ticker pill pattern
  (`font-mono text-cyan-300/95 bg-black/55 border border-zinc-800 rounded-md`) —
  data, not prose.
- **Radius / type** — bubbles `rounded-xl`, body `font-sans`, headings/brand
  `font-heading` (Syne). No light mode.

---

## 6. States

- **Empty** — first visit shows a short intro + 3–4 example prompts ("What changed
  for NVDA this week?", "Which company is most connected?") that seed the input on
  click. Lucide empty-state icon `h-8 w-8`.
- **Streaming** — assistant bubble fills token-by-token; a typing indicator
  (`MessageFooter` or a Loader) shows until the first token.
- **Tool activity** — while the agent runs a tool, show a subtle status line
  ("Looking up NVDA relationships…") derived from the streamed tool-call part, so
  the user sees the agent working rather than a frozen spinner.
- **Error** — rose tokens (`text-rose-200`, `border-rose-500/30`,
  `bg-rose-500/10`) with a retry affordance; never a blank failure.

---

## 7. Message rendering fidelity

Stored messages carry their full `parts` (`chat-schema.md`). On load and on live
stream, render text parts as markdown and tool-call parts as compact, collapsible
status chips — so a resumed thread shows the same shape it had live, including
which tools ran.

---

## 8. Demo mode

Optional and deferred: the `app/demo/*` mirror can either hide chat or expose it
read-only with canned content. Not required for v1 (`agent-plan.md` — pure
addition; demo parity is a later choice).

---

## 9. Out of scope (deferred)

- Durable-memory UI (managing remembered facts).
- Attachments, file/image upload, voice.
- Multi-thread search, sharing, or export.
