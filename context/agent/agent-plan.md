# Watchlist Agent — Plan

**Status:** Design
**Last updated:** June 29, 2026
**Next docs:** `chat-schema.md` (thread persistence tables), `chat-tools.md` (read-only tool set), `chat-ui.md` (the chat surface) — all derive from this file.

---

## 1. Purpose

The Watchlist Agent is an **interactive, in-app agent the user chats with about
their own watchlist.** It answers questions, explains the relationships and news
Finerel has already extracted, and reasons across the user's data on demand —
"what changed for NVDA this week?", "why did you flag the TSMC partnership?",
"which of my tickers is most connected?"

It is a **new surface, not a replacement.** The morning briefing pipeline
(`fetch → extract → store → email`) stays exactly as it is today: deterministic,
always-on, untouched. The agent reads the same stored data the pipeline produces
and turns it into a conversation. The user gets two things from one dataset — a
daily email they don't have to ask for, and an agent they can interrogate when
they want more.

This is the project's headline interactive capability — an agent that knows your
watchlist and can talk about it — not just an LLM with a chat box.

---

## 2. What it is (and is not)

**It is** a tool-driven chat loop. Given the user's question and a set of
read-only, `userId`-scoped tools, it calls tools to gather what it needs, reasons
over the result, and streams an answer. Uses `models.chat` via the Vercel AI
SDK's tool-calling loop (`streamText` with tools), across multiple turns.

**It is not** the extractor. `extract_relationships` stays a deterministic
`generateObject` call — structured extraction needs a fixed schema and
reliability, not a loop. **It is not** the email pipeline, and it does not decide
whether to send email — that path is unchanged and deterministic. The agent loop
belongs only where there is genuine **judgment and open-ended interaction**:
holding a conversation across the user's data.

> This boundary is deliberate. A multi-turn conversation over the watchlist graph
> — variable tool paths, follow-ups, memory — is where an agent loop earns its
> place. A fixed pipeline step does not.

---

## 3. Where it lives and when it runs

In the app, on demand. The agent runs **per user message**, inside an
authenticated chat surface in the `(app)` route group — not on a schedule, not in
the cron. There is no new QStash resource and no per-user job.

Every run is scoped to the signed-in user. The recipient of an answer is always
the person asking; the agent only ever sees data filtered by their `userId`.

---

## 4. What it does each turn (the loop)

1. **Gather** — calls read-only tools to assemble what the question needs:
   watchlist tickers, stored relationships (filtered by ticker / type /
   confidence / date), recent news, graph stats, past briefings. It calls only
   the tools the current question requires.
2. **Reason** — interprets the user's intent over what it gathered, comparing,
   ranking, and explaining as needed.
3. **Answer** — streams a grounded reply that cites the user's own data. When the
   data doesn't support an answer, it says so rather than inventing one.

The loop terminates when the agent emits its final message for the turn. A hard
cap on tool-call steps prevents runaway loops; on error or cap-hit it returns a
plain "couldn't complete that" rather than a fabricated answer.

---

## 5. The tool set

All tools are **read-only and `userId`-scoped server-side.** They wrap query
paths that already exist for the dashboard, so the agent and the UI read through
the same logic. The agent is never forced to call every tool — it chooses the
path the question requires, and that choosing *is* the agent loop.

| Tool | Reads | Answers questions like |
| --- | --- | --- |
| `get_watchlist` | `watchlists` | "what am I tracking?" |
| `query_relationships` | `relationships` (ticker / type / confidence / date filters) | "show NVDA partnerships this month, high confidence" |
| `get_graph_stats` | graph aggregates | "which company is most connected?" |
| `search_news` | `news_items` | "what drove the TSMC mention last week?" |
| `get_briefing_history` | `briefings` | "what did you tell me on Monday?" |

No tool writes, sends, or mutates. Write actions (e.g. adding a ticker) and any
send capability are explicit future scope, not part of this agent's contract.

---

## 6. Memory

**v1: conversation memory only.** Threads persist so a conversation survives
reload and can be resumed — `chat_threads` + `chat_messages`, both `userId`-scoped
(schema lives in `chat-schema.md`). The agent loads the thread's prior messages
as context each turn and saves the new turn when it completes.

**Deferred (not v1):** durable user facts (preferences, holdings, focus areas the
agent remembers across threads) and semantic recall over past messages. Both are
clean later additions; neither is required to ship the conversation.

---

## 7. Boundaries — model decides content, code enforces trust

A hard line, same pattern as the rest of the system:

- **The agent decides** *what* to say.
- **Deterministic code enforces** *who* it answers (the signed-in user), *that*
  every tool is scoped by `userId`, and *that* the tools are read-only. The agent
  never sets the recipient, never bypasses the `userId` scope, never writes to the
  DB, and never reaches another user's data.

The email pipeline's own boundaries are unchanged — this agent does not touch
that path.

---

## 8. Non-goals

- No buy/sell signals, prices, or recommendations — unchanged from the spec.
- Does not replace, gate, or modify the morning briefing email pipeline.
- Does not fetch news or run extraction; it consumes their stored output via
  tools.
- No write or send actions in v1 — read-only only.
- No durable cross-thread memory or semantic recall in v1.
- No new schedules or per-user QStash resources.

---

## 9. What success looks like

- A user can open the chat and get grounded answers about their watchlist that
  cite their own stored data, not generic market commentary.
- Conversations persist and can be resumed.
- The agent calls only the tools a question needs, and its answers never claim
  data it didn't retrieve.
- In an interview, the chat loop, the read-only `userId`-scoped tool set, the
  structured-call-vs-agent-loop boundary, and the "new surface, email untouched"
  decision can each be explained in a sentence.
