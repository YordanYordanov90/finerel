# 27 — Chat UI (chat surface)

**Depends on:** `10-app-shell.md`, `26-chat-api-route.md`
**Design spec:** `agent/chat-ui.md` (source of truth), `ui-context.md` (tokens)

---

## Purpose

The in-app surface where the user talks to the Watchlist Agent. The same
conversation UI is mounted in **two shells, built once**:

1. **Full `/chat` page** — deep sessions, thread management, wide reading, mobile.
2. **Docked "Ask" panel** — a right-side slide-over launched from anywhere in the
   dashboard, so the user can ask about the view they're on without leaving it.

Both render the same `ChatSurface` (the `useChat` conversation pane + prompt input
+ message rendering); only the wrapper differs. This is a docked panel, **not** a
bottom-right "support bubble" — it's a first-class analytical surface, not a help
widget.

---

## Files to Create

| Path | Purpose |
|---|---|
| `app/(app)/chat/page.tsx` | The full chat page (inside the authenticated `(app)` group) |
| `components/chat/chat-surface.tsx` | The shared conversation UI — `useChat` pane + prompt input + message rendering. Consumed by **both** the page and the panel. *(exists)* |
| `components/chat/*` | `thread-switcher`, `chat-prompt-input`, `chat-message`, `tool-call-chip`, `markdown-content`, `chat-empty-state` *(exist)* |
| `components/chat/ask-panel.tsx` | `AskChatProvider` + `AskChatLauncher` + right-side `Sheet` wrapping `ChatSurface` *(exists)* |
| `lib/chat/page-context.ts` | Derives the panel's page-context hint from the pathname *(exists)* |
| `app/api/chat/threads/route.ts` | `GET` — lists threads/messages for the client-side panel *(exists)* |
| `app/(app)/layout.tsx` | Mount `AskPanel` once at the shell level so it's reachable on every dashboard page (extend existing file) |
| `components/AppSidebar.tsx` | Add a `Chat` nav item (extend existing file) |
| `components/ui/message.tsx` (+ siblings) | shadcn chat primitives via `npx shadcn@latest add message` — do not hand-edit |

---

## Requirements

### Components (`agent/chat-ui.md` §3)

- Install shadcn chat primitives: `npx shadcn@latest add message` →
  `Message` (+ `MessageAvatar`/`MessageContent`/`MessageHeader`/`MessageFooter`),
  `Bubble` (+ `BubbleContent`), `MessageScroller`, `MessageGroup`.
- **Not provided by shadcn — compose from existing primitives:**
  - **Prompt input** from `Textarea` + `Button`: auto-grow, Enter to send /
    Shift+Enter newline, send disabled while streaming.
  - **Conversation container** — `MessageScroller` is the scroll region.
- Client state via the AI SDK `useChat` hook, posting to `/api/chat`.

### Navigation

- Add a `Chat` item to `AppSidebar` (Lucide `MessageSquare`, `h-5 w-5`, active
  `text-cyan-400`) — same pattern as the News entry.

### Layout (`agent/chat-ui.md` §4)

- Conversation pane: `MessageScroller` filling available height, auto-scroll to
  latest on new tokens; sticky prompt input pinned to the bottom.
- Thread switcher: list user threads (newest first); selecting one loads its
  messages. "New chat" starts an empty thread.

### Visual language (`ui-context.md`)

- User messages `align="end"`, cyan-tinted bubble (`bg-cyan-500/10`,
  `border-cyan-500/40`); assistant `align="start"`, zinc bubble (`bg-[#111111]`,
  `border-zinc-800`).
- Assistant content renders as **markdown** (streaming-friendly renderer).
- Tickers in messages use the ticker-pill pattern
  (`font-mono text-cyan-300/95 bg-black/55`).
- Bubbles `rounded-xl`, body `font-sans`, dark only.

### States (`agent/chat-ui.md` §6)

- **Empty:** intro + 3–4 example prompts that seed the input on click.
- **Streaming:** assistant bubble fills token-by-token; typing indicator until
  first token.
- **Tool activity:** subtle status line ("Looking up NVDA relationships…") derived
  from the streamed tool-call part.
- **Error:** rose tokens + retry; never a blank failure.

### Rendering fidelity

- Render stored/streamed text parts as markdown and tool-call parts as compact,
  collapsible status chips, so a resumed thread matches its live shape.

### Docked "Ask" panel

- **Wrapper, not a rewrite:** `AskPanel` is a right-side shadcn `Sheet`
  (consistent with the graph node-detail drawer) wrapping the same `ChatSurface`
  the page uses. No duplicate conversation logic.
- **Launcher:** a persistent "Ask" trigger in the top bar or sidebar — **not** a
  floating bottom-right circle (avoids the "support widget" read). Lucide
  `MessageSquare` / `Sparkles`.
- **Mounted shell-level** in `app/(app)/layout.tsx` so it's available on every
  dashboard page and the dashboard stays visible beside it (context preserved).
- **Width:** wide enough for readable analytical answers (relationships, pills,
  source links) — panel width, not popover width.
- **Active thread:** the panel keeps its own active-thread state and remembers the
  last-open thread across navigation (e.g. `localStorage`). It does **not** depend
  on the page's `?thread=` param, since other pages don't carry it.
- **Hand-off both ways:** an "Expand to full page" action opens
  `/chat?thread=<id>` with the same thread; the panel and page share persistence
  (feature 24), so a conversation continues across either surface.
- **Mobile:** on narrow viewports the panel goes full-width (or defers to the
  `/chat` page) rather than cramping.

### Page-context seeding

- When a turn is sent **from the panel**, include a small, sanitized descriptor of
  the current view so the agent can answer about what the user is looking at —
  e.g. `{ page: "graph", focus: { ticker: "NVDA" } }` or the active history
  filters.
- Sent as an extra context field on the `/api/chat` request and injected by the
  route as system context (requires the small acceptance noted in
  `26-chat-api-route.md`). The agent's **tools are unchanged**; this only frames
  the question.
- **Trust boundary holds:** page context is a hint only — it never sets `userId`,
  never widens tool scope, and is never trusted for access (`agent/agent-plan.md`
  §7). `userId` still comes from the session.
- The full `/chat` page sends no page context (there's no underlying view to
  describe) — this applies to the panel only.

---

## Acceptance Criteria

1. `/chat` renders inside the dashboard shell with the new sidebar entry active.
2. Sending a message streams the assistant reply token-by-token.
3. Returning to a thread loads its full history in order.
4. "New chat" starts a fresh thread; the switcher lists threads newest-first.
5. User vs assistant messages are visually distinct per `ui-context.md`; tickers render as pills; assistant content renders markdown.
6. Empty, streaming, tool-activity, and error states all render.
7. `components/ui/` shadcn files are not hand-edited.
8. The same `ChatSurface` renders in both the `/chat` page and the `AskPanel` — no duplicated conversation logic.
9. The `AskPanel` launcher is reachable from every dashboard page (not a floating support bubble); the panel is a right-side `Sheet` wide enough for analytical answers.
10. A conversation started in the panel can be continued on the `/chat` page (and vice versa) via shared persistence; "Expand to full page" carries the thread.
11. Turns sent from the panel include sanitized page context that frames the answer but never changes `userId` or tool scope; the `/chat` page sends none.
12. On narrow viewports the panel is full-width or defers to `/chat` rather than cramping.

---

**Before closing this session:** Update `progress-tracker.md` — mark feature 27 done; the chat agent is now end-to-end with both the full page and the docked Ask panel.
