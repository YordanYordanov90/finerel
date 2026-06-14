# Core Intelligence Spec

**Project:** FinRel  
**Version:** v1.0  
**Status:** Ready for implementation  
**Last updated:** June 11, 2026

---

## Purpose

This file is the technical contract for `extract_relationships` — the core
intelligence tool of FinRel. Everything in the system either feeds into it
(news fetching) or consumes its output (storage, briefing generation, graph
visualization, dashboard).

This document defines three things precisely:

1. The input schema — what the tool receives
2. The output schema — what the tool returns
3. The extraction prompt — what instructions the model receives

The Zod schemas in this file are the single source of truth. TypeScript types
are derived from them via `z.infer`. The prompt and schemas must stay in sync —
if a field is added to the schema, the prompt must explain how to populate it.

---

## Runtime Context

- **SDK:** Vercel AI SDK `generateObject`
- **Model:** `openai('gpt-4.1-mini')`
- **Validation:** Zod (strict schemas, no `.passthrough()`)
- **Location:** `lib/agent/tools/extract-relationships.ts`
- **Schema location:** `lib/schemas/relationships.ts` (shared with dashboard)

---

## 1. Input Schema

The tool receives a batch of normalized news items from `fetch_watchlist_news`.
Input is validated with Zod before being passed to the model — Finnhub API
responses are not trusted raw.

```ts
// lib/schemas/relationships.ts

import { z } from 'zod'

export const newsItemSchema = z.object({
  id: z.string(),                  // Finnhub article ID or URL hash
  headline: z.string(),            // Article headline
  summary: z.string(),             // 2–3 sentence summary from Finnhub
  url: z.string().url(),           // Source article URL
  source: z.string(),              // Publisher name (e.g. "Reuters", "Bloomberg")
  publishedAt: z.string(),         // ISO 8601 datetime string
  mentionedTickers: z.array(z.string()), // Tickers detected in or associated with the article
})

export const extractionInputSchema = z.object({
  newsItems: z.array(newsItemSchema).min(1).max(50),
  focusTickers: z.array(z.string()).optional(), // User's watchlist — used to prioritize extraction
  userId: z.string(),              // Scopes the run — passed through to output for storage
})

export type ExtractionInput = z.infer<typeof extractionInputSchema>
export type NewsItem = z.infer<typeof newsItemSchema>
```

**Notes:**
- Maximum 50 news items per extraction run. If the batch is larger, chunk it before calling the tool.
- `focusTickers` is optional but should always be passed — it helps the model prioritize relationships involving the user's watchlist companies over peripheral mentions.
- `summary` from Finnhub free tier is the primary text the model reasons over. No full article body is fetched in MVP.

---

## 2. Output Schema

The tool returns a validated batch of extracted relationships plus a brief
human-readable summary for the briefing email.

```ts
// lib/schemas/relationships.ts (continued)

export const relationTypeSchema = z.enum([
  'partnership',
  'supply_chain',
  'executive_mention',
  'product_collaboration',
  'investment',
])

export const impactLevelSchema = z.enum(['high', 'medium', 'low'])

export const extractedRelationshipSchema = z.object({
  sourceCompany: z.string(),       // Canonical company name (e.g. "NVIDIA")
  sourceTicker: z.string().optional(), // Ticker if identifiable (e.g. "NVDA")
  targetCompany: z.string(),       // Canonical company name (e.g. "TSMC")
  targetTicker: z.string().optional(),
  relationType: relationTypeSchema,
  confidence: z.number().min(0).max(1), // 0.0–1.0 float
  impactLevel: impactLevelSchema,
  contextSnippet: z.string().max(300),  // Direct quote or close paraphrase from the source text
  sourceNewsId: z.string(),        // References newsItemSchema.id
  sourceUrl: z.string().url(),     // Passed through from newsItemSchema.url for transparency
  extractedAt: z.string(),         // ISO 8601 datetime of extraction
})

export const extractionOutputSchema = z.object({
  relationships: z.array(extractedRelationshipSchema),
  summary: z.string().max(500),    // 2–4 sentence briefing summary for email delivery
  itemsProcessed: z.number(),      // How many news items were analyzed
  userId: z.string(),              // Passed through from input for storage scoping
})

export type ExtractionOutput = z.infer<typeof extractionOutputSchema>
export type ExtractedRelationship = z.infer<typeof extractedRelationshipSchema>
export type RelationType = z.infer<typeof relationTypeSchema>
export type ImpactLevel = z.infer<typeof impactLevelSchema>
```

**Field rules:**

`confidence` — How certain the model is that this is a real, meaningful
relationship based on the source text. Not a sentiment score.

| Range    | Meaning                                                          |
| -------- | ---------------------------------------------------------------- |
| 0.8–1.0  | Explicitly stated in the article with clear named parties        |
| 0.5–0.79 | Strongly implied, both parties named but relationship inferred   |
| 0.0–0.49 | Speculative, one party unnamed, or relationship type ambiguous   |

`impactLevel` — Business significance of the relationship to a financial
researcher, not price impact prediction.

| Level  | Meaning                                                              |
| ------ | -------------------------------------------------------------------- |
| high   | New formal agreement, major investment, named supply chain contract  |
| medium | Executive comment, ongoing collaboration mention, rumored deal       |
| low    | Passing mention, historical reference, analyst speculation           |

`contextSnippet` — Must be traceable to the source article. Direct quote or
very close paraphrase. Max 300 characters. Never invented or generalized.

`summary` — Written for the briefing email. Plain language, no jargon. Names
the most significant 1–2 relationships found. Does not include recommendations
or price language.

---

## 3. Extraction Prompt

### System Prompt

```
You are a financial relationship extraction engine. Your only job is to read
financial news articles and identify structured, factual relationships between
companies.

You extract relationships of exactly five types:
- partnership: A formal or announced collaborative agreement between two companies.
- supply_chain: One company supplies components, materials, or services to another.
- executive_mention: A named executive at one company directly references another company.
- product_collaboration: Two companies are jointly building, launching, or integrating a product.
- investment: One company has invested in, acquired, or taken a stake in another.

Rules you must follow without exception:
1. Only extract relationships that are explicitly stated or very strongly implied in the provided text. Do not infer relationships from general industry knowledge.
2. Both the source company and target company must be named or clearly identifiable in the text.
3. Assign confidence scores conservatively. When in doubt, score lower.
4. The contextSnippet must come directly from the article text — never paraphrase beyond light cleanup.
5. If no clear relationship exists in an article, do not extract one. An empty relationships array is a valid and correct response.
6. Never produce buy/sell signals, price predictions, or investment recommendations.
7. Prefer precision over recall. One high-confidence relationship is more valuable than five speculative ones.
```

### User Prompt Template

```ts
export function buildExtractionPrompt(input: ExtractionInput): string {
  const tickerContext = input.focusTickers?.length
    ? `The user's watchlist tickers are: ${input.focusTickers.join(', ')}. Prioritize relationships involving these companies, but extract any clear relationship regardless of whether it involves a watchlist ticker.`
    : ''

  const articles = input.newsItems
    .map((item, i) =>
      `[Article ${i + 1}]
ID: ${item.id}
Source: ${item.source}
Published: ${item.publishedAt}
Headline: ${item.headline}
Summary: ${item.summary}
URL: ${item.url}
Tickers mentioned: ${item.mentionedTickers.join(', ') || 'none'}`
    )
    .join('\n\n')

  return `${tickerContext}

Analyze the following ${input.newsItems.length} news articles and extract structured company relationships.

${articles}

Return all relationships found. If an article contains no clear relationship between named companies, skip it. Write the summary field as a 2–4 sentence plain-language briefing suitable for an email — name the most significant relationships found today.`
}
```

---

## 4. Tool Implementation Shape

```ts
// lib/agent/tools/extract-relationships.ts

import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import {
  extractionInputSchema,
  extractionOutputSchema,
  ExtractionInput,
  ExtractionOutput,
} from '@/lib/schemas/relationships'

export async function extractRelationships(
  rawInput: unknown
): Promise<ExtractionOutput> {
  // Validate input at the boundary — never trust caller
  const input = extractionInputSchema.parse(rawInput)

  const { object } = await generateObject({
    model: openai('gpt-4.1-mini'),
    schema: extractionOutputSchema,
    system: SYSTEM_PROMPT,         // string constant defined in this file
    prompt: buildExtractionPrompt(input),
  })

  // generateObject + Zod schema guarantees output shape —
  // but re-validate before returning to catch any edge cases
  return extractionOutputSchema.parse({
    ...object,
    userId: input.userId,          // Always pass through — never trust model to echo it
    extractedAt: new Date().toISOString(),
  })
}
```

**Security note:** `userId` and `extractedAt` are always set by the tool, never
by the model. These fields exist in the output schema but are not in the prompt —
the model has no opportunity to influence who owns the data or when it was extracted.

---

## 5. Error Handling

A failed extraction run must not crash the morning briefing. Wrap the tool call:

```ts
try {
  const result = await extractRelationships(input)
  await storeRelationships(result)
} catch (error) {
  // Log with enough context to debug — never expose to client
  console.error('[extract_relationships] failed', {
    userId: input.userId,
    itemCount: input.newsItems.length,
    error: error instanceof Error ? error.message : 'unknown',
  })
  // Continue briefing run — push a "no new relationships found today" summary
}
```

---

## 6. Relationship Type Definitions (Reference)

These definitions are authoritative. The system prompt uses them. The dashboard
displays them. They must never diverge.

| Type                    | Definition                                                                 | Example                                              |
| ----------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------- |
| `partnership`           | Formal or announced collaborative agreement between two named companies    | "Apple and Google announced a joint AI initiative"   |
| `supply_chain`          | One company supplies components, materials, or services to another         | "TSMC confirmed it supplies chips to NVIDIA"         |
| `executive_mention`     | A named executive at one company directly references another company       | "Jensen Huang mentioned Microsoft in his keynote"    |
| `product_collaboration` | Two companies jointly building, launching, or integrating a product        | "Samsung and Microsoft are co-developing a foldable" |
| `investment`            | One company has invested in, acquired, or taken a stake in another         | "SoftBank invested $500M in OpenAI"                  |

---

## 7. What Downstream Systems Expect

Every system that consumes `extract_relationships` output depends on this schema.
Any change to the output schema is a breaking change requiring updates to:

- `store_relationships` tool — Drizzle insert shape
- `lib/db/schema.ts` — `relationships` table columns
- Dashboard relationship card component — field rendering
- React Flow graph builder — node/edge construction
- Briefing generator — `summary` field consumption
- Email delivery handler (Resend) — `summary` field consumption

Do not change the output schema without updating all of the above and running
a migration.
