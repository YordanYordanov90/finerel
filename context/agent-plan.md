# Briefing Agent — Plan

**Status:** Design
**Last updated:** June 26, 2026
**Next doc:** `tools-and-decision.md` (derives the tool set + decision logic from this file)

---

## 1. Purpose

The Briefing Agent decides, unattended, **whether FinRel has something worth
telling a user today — and if so, what to say.**

Today the morning run is a fixed pipeline: `fetch → extract → store → email`. It
always sends, so quiet days produce empty emails and noise. The agent replaces
the **email-decision step** of that pipeline with a real agent loop: it gathers
context with tools, judges significance, and chooses an outcome (send, stay
silent, or send a weekly digest). The user pays for the trust that an email
arriving always means it's worth opening, and silence never means they missed
something.

This is the project's headline capability — an autonomous agent that monitors a
watchlist and decides when to speak — not just an LLM that fills a template.

---

## 2. What it is (and is not)

**It is** a tool-driven agent loop. Given a goal and a set of read-only tools, it
calls tools to gather what it needs, reasons over the result, and emits a single
structured decision. Uses `models.briefing` via the Vercel AI SDK's tool-calling
loop (`generateText` with tools), not a one-shot call.

**It is not** the extractor. `extract_relationships` stays a deterministic
`generateObject` call — structured extraction needs a fixed schema and
reliability, not a loop. The agent loop belongs only where there is genuine
**judgment**: deciding whether today clears the bar and which message to compose.

> This boundary is deliberate. The skill being demonstrated is knowing *where* an
> agent loop earns its place and where a constrained call is the correct tool.

---

## 3. When it runs

No new schedule. It runs inside the **existing hourly QStash tick**
(`0 3-19 * * *` UTC), per user, at their configured `briefingTime` hour (EEST).
Scheduling stays in app logic — the cron is just a heartbeat.

Per user, per qualifying tick:

- The extraction pipeline runs first (fetch → extract → store) so the day's data
  exists in the DB.
- The agent then runs **once** to decide what to do about the email.
- Calling code passes plain context the agent should not have to derive itself:
  `isWeeklyDigestDay` (e.g. Monday), the user's cadence preference, and today's
  date. The agent decides; the code supplies the calendar facts.

---

## 4. What it does each run (the loop)

1. **Gather** — calls read-only tools to assemble the picture: today's stored
   relationships, recent watchlist news, graph stats / growth, and the last
   briefing sent (to avoid repeating itself). It calls only the tools it needs
   for the decision in front of it.
2. **Assess** — judges the day's significance from what it gathered: are there
   new relationships of real weight (impact + confidence)? notable news
   clustering? meaningful graph growth since last time?
3. **Decide** — emits exactly one outcome (see §5).
4. **Compose** — for a sending outcome, writes the email content (subject framed
   by the single best item, plus body). For a hold, writes a short logged reason
   and nothing else.
5. **Hand off** — returns a structured result. Deterministic code does the
   actual send and enforces *who* and *security* (see §6).

The loop terminates when the agent returns its final structured decision. A hard
cap on tool-call steps prevents runaway loops; on error or cap-hit it falls back
to **hold** (silence is the safe default — never send garbage).

---

## 5. How it decides

The agent returns one of three outcomes:

| Outcome | When | Result |
| --- | --- | --- |
| `SEND_DAILY` | The day clears the significance bar — new relationships of real weight, or a notable news cluster. | Composes + sends the daily briefing, subject framed by its best item. |
| `HOLD` | Below the bar — nothing, or only low-value noise. | Sends nothing. Logs the reasoning. Data still lives in the dashboard and rolls into the next digest. |
| `SEND_WEEKLY_DIGEST` | `isWeeklyDigestDay` is true. | Composes + sends the weekly synthesis (week's top relationships, heating-up pairs, graph growth, most-active tickers) regardless of whether today alone cleared the bar — guarantees a heartbeat. |

**The significance bar is the agent's judgment, not a hardcoded threshold.** It
weighs impact level, confidence, novelty (vs. the last briefing), and news
clustering. The reasoning is captured so it can be logged and shown — the
decision is auditable, which is itself a talking point.

**Tool selection** is driven by what the agent still needs to decide. It is not
forced to call every tool: a day with obvious high-impact relationships may need
only `get_todays_relationships`; a quiet day may pull news and graph stats before
concluding `HOLD`; a weekly-digest day pulls the week's aggregates. The agent
chooses its path through the tools — that choosing *is* the agent loop.

---

## 6. Boundaries — model decides content, code enforces trust

A hard line, same pattern as `extract_relationships`:

- **The agent decides** *what* to say and *whether* to say it.
- **Deterministic code enforces** *who* it goes to (recipient from `users`,
  scoped by `userId`), *that* it's allowed, and *records* it. The agent never
  sets the recipient, never bypasses the `userId` scope, never writes to the DB
  directly — its tools are read-only.

The briefing record is stored regardless of the send outcome, so the dashboard
and history stay accurate even when the agent holds.

---

## 7. Non-goals

- No buy/sell signals, prices, or recommendations — unchanged from the spec.
- The agent does not fetch news or run extraction; it consumes their stored
  output via tools.
- No new schedules, no per-user QStash resources.
- No multi-hop graph reasoning — it reads stats and lists, not a graph traversal.

---

## 8. What success looks like

- Quiet days are silent; sending days always carry a clearly-best item in the
  subject.
- A weekly digest always lands, telling the compounding-value story.
- The decision and its reasoning are logged for every run.
- In an interview, the loop, the tool set, the structured-call-vs-agent-loop
  boundary, and the model-decides-vs-code-enforces split can each be explained in
  a sentence.
