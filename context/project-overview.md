# FinRel — Financial Researcher Agent

## Overview

FinRel is a multi-tenant AI agent that acts as a personal financial relationship
intelligence layer. It monitors a user's stock watchlist, extracts structured
inter-company relationships from financial news (partnerships, supply chain
mentions, investments, etc.), and delivers a concise morning briefing via
email. All discovered relationships accumulate into a queryable, visual
knowledge graph over time. The system is strictly factual — it surfaces
intelligence, never makes buy/sell recommendations.

## Goals

1. Deliver a reliable, zero-noise daily morning briefing at 09:00 EEST for each user's watchlist.
2. Build a persistent, growing relationship graph that compounds in value over weeks and months.
3. Serve as a portfolio-quality SaaS demonstrating multi-tenant AI agent architecture to potential employers and clients.

## Core User Flow

1. User lands on the marketing page and understands the product in under 10 seconds.
2. User explores the read-only demo dashboard (pre-seeded with real relationship data — no signup required).
3. User signs up via Clerk and configures their personal watchlist (10–15 tickers to start).
4. Every morning at 09:00 EEST, QStash triggers the cron API route on Vercel.
5. Agent fetches recent news via Finnhub, runs `extract_relationships`, persists results to Neon Postgres.
6. Morning briefing is delivered via email as a clean summary.
7. User reviews the dashboard for deeper exploration: relationship graph, briefing history, search.

## Features

### Intelligence Layer

- Watchlist-scoped news fetching (Finnhub free tier, swappable)
- Structured relationship extraction via `generateObject` + Zod schemas (GPT-4.1-mini)
- Five relationship types: `partnership`, `supply_chain`, `executive_mention`, `product_collaboration`, `investment`
- Confidence score (0–1) and impact level (high / medium / low) on every extracted relationship
- Source URL + context snippet attached to every relationship for full transparency

### Morning Briefing

- Automated daily cron via Upstash QStash → Vercel (signature-verified API route)
- Email delivery via Resend to the user's email address (from Clerk, already stored)
- Clean, structured summary with top relationships of the day

### Dashboard

- Overview page: today's key relationships at a glance
- Relationship graph: interactive React Flow visualization (nodes = companies, edges = typed relationships)
- Briefing history: searchable archive with filters (relation type, confidence, date, ticker)
- Watchlist management: add/remove tickers, view activity per ticker
- Settings: email address display (read-only, from Clerk), briefing time preference

### Conversational Agent (Design)

- In-app **Watchlist Agent** the user chats with about their own watchlist —
  answers questions and explains stored relationships, news, and graph stats via
  read-only `userId`-scoped tools. Pure addition; the morning briefing email stays
  unchanged. Conversation history persists per thread.
- Full design specs in [`agent/`](agent/agent-plan.md) — backbone plus schema,
  tools, and chat-UI docs.

### Portfolio / Demo Experience

- Public landing page explaining the product with clear value proposition
- Read-only demo dashboard pre-seeded with real relationship data (no signup required)
- Clerk-gated full experience for signed-up users

## Scope

### In Scope

- Multi-tenant architecture (every entity scoped to `userId`)
- Personal watchlist per user (MVP: 10–15 tickers)
- Five core relationship types (see above)
- Daily morning briefing via email (Resend)
- Relationship graph visualization
- Briefing history and search
- Demo mode with seeded data for portfolio presentation
- Owner-only production access during Phase 1

### Out of Scope

- Telegram integration (Phase 2: interactive agent chat, user can query relationships conversationally)
- Real-time push alerts beyond the scheduled daily briefing
- Price prediction, sentiment signals, or portfolio allocation advice
- Multi-hop graph traversal or dedicated graph database
- BYOK (Bring Your Own Key) for AI inference — platform key only for MVP
- Full article text fetching — headline + summary snippet only for MVP
- Broad market hype discovery outside the user's watchlist

## Success Criteria

1. The morning briefing runs reliably every day at 09:00 EEST with zero manual intervention.
2. Extracted relationships have high precision — the user can trust that surfaced items are real and relevant.
3. A first-time visitor understands the product and explores the demo in under 2 minutes.
4. After 4–6 weeks of accumulation, the relationship graph provides visible, compounding research value.
5. The codebase demonstrates multi-tenant AI agent architecture clearly enough to discuss in a technical interview.

