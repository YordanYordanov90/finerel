# 04 — Extract Relationships Tool

**Depends on:** `01-drizzle-schema.md`, `02-agent-scaffold.md`

---

## Purpose

Implement the core intelligence tool: `extract_relationships`. This is the
highest-leverage component in the system — everything upstream feeds into it,
everything downstream consumes its output.

**`core-intelligence-spec.md` is the authoritative reference for this entire
session. Read it completely before writing any code.**

---

## Files to Create

| Path | Purpose |
|---|---|
| `lib/schemas/relationships.ts` | All Zod schemas — shared across all routes (architecture.md: "lib/schemas/ — Zod schemas for all tool inputs/outputs and API boundaries. Single source of truth for data shapes") |
| `lib/agent/tools/extract-relationships.ts` | Tool implementation |

---

## Requirements

### Zod Schemas (from core-intelligence-spec.md §1, §2 — copy exactly)

All schemas live in `lib/schemas/relationships.ts`. TypeScript types are derived
via `z.infer` — never duplicate type definitions (code-standards.md).

**Input schemas:**
- `newsItemSchema` — fields: `id`, `headline`, `summary`, `url` (`.url()`), `source`, `publishedAt`, `mentionedTickers` (string array)
- `extractionInputSchema` — fields: `newsItems` (array, min 1, max 50), `focusTickers` (optional string array), `userId` (string)

**Output schemas:**
- `relationTypeSchema` — enum: `partnership`, `supply_chain`, `executive_mention`, `product_collaboration`, `investment`
- `impactLevelSchema` — enum: `high`, `medium`, `low`
- `extractedRelationshipSchema` — fields: `sourceCompany`, `sourceTicker` (optional), `targetCompany`, `targetTicker` (optional), `relationType`, `confidence` (number 0–1), `impactLevel`, `contextSnippet` (max 300 chars), `sourceNewsId`, `sourceUrl` (`.url()`), `extractedAt`
- `extractionOutputSchema` — fields: `relationships` (array of above), `summary` (max 500 chars), `itemsProcessed` (number), `userId`

**Exported types:**
`ExtractionInput`, `ExtractionOutput`, `ExtractedRelationship`, `NewsItem`, `RelationType`, `ImpactLevel`

### AI SDK Integration (from core-intelligence-spec.md §4, architecture.md)

- Use `generateObject` from `ai` package (Vercel AI SDK).
- Model: `openai('gpt-4.1-mini')` from `@ai-sdk/openai`.
- Architecture.md decision: "Vercel AI SDK everywhere.
  generateObject + Zod for extract_relationships. Provider-agnostic — switching
  model is one line."
- Code-standards.md: "Use Vercel AI SDK generateObject for all LLM calls — never
  call the OpenAI SDK directly."

### System Prompt (from core-intelligence-spec.md §3 — use verbatim)

The system prompt defines the model as a "financial relationship extraction engine"
with exactly five relationship types and seven rules. Copy the system prompt from
core-intelligence-spec.md §3 exactly — do not paraphrase or shorten.

### User Prompt (from core-intelligence-spec.md §3)

Implement `buildExtractionPrompt(input: ExtractionInput): string` exactly as
defined in core-intelligence-spec.md §3. It formats articles with ID, source,
published date, headline, summary, URL, and mentioned tickers.

### Security (from core-intelligence-spec.md §4 security note)

- `userId` is always set by the tool from the input, never by the model.
- `extractedAt` is always set by the tool as `new Date().toISOString()`, never by the model.
- Core-intelligence-spec.md: "userId and extractedAt are always set by the tool,
  never by the model. These fields exist in the output schema but are not in the
  prompt — the model has no opportunity to influence who owns the data or when
  it was extracted."

### Input Validation

- Raw input is validated with `extractionInputSchema.parse(rawInput)` at the
  boundary — never trust the caller (core-intelligence-spec.md §4).
- Maximum 50 news items per run. If larger, the caller must chunk before calling
  (core-intelligence-spec.md §1 notes).

### Output Validation

- `generateObject` + Zod schema guarantees output shape, but re-validate before
  returning (core-intelligence-spec.md §4 implementation shape).
- Override `userId` and `extractedAt` in the parsed output.

### Error Handling (from core-intelligence-spec.md §5)

- Wrap the tool call in try/catch.
- Log with context: `userId`, `itemCount`, error message.
- Never expose errors to the client.
- A failed extraction must not crash the morning briefing — the caller continues
  and pushes a "no new relationships found today" fallback.

---

## Acceptance Criteria

1. `lib/schemas/relationships.ts` exports all schemas and types listed in core-intelligence-spec.md §1 and §2.
2. Tool accepts a batch of `newsItemSchema` items wrapped in `extractionInputSchema`.
3. Tool returns a valid `extractionOutputSchema` object.
4. `confidence` values are 0–1 floats on every returned relationship.
5. All five relation types (`partnership`, `supply_chain`, `executive_mention`, `product_collaboration`, `investment`) are recognized and returned correctly.
6. An empty `relationships` array is a valid response when no relationships are found.
7. `userId` in the output always matches the input `userId`, regardless of model output.
8. `extractedAt` is an ISO 8601 timestamp set by the tool, not echoed from the model.
9. A simulated extraction failure (e.g. network error) is caught, logged, and does not throw to the caller.
10. System prompt matches core-intelligence-spec.md §3 verbatim.

---

**Before closing this session:** Update `progress-tracker.md` — move `extract_relationships` to Completed, note any model behavior observations (confidence distribution, edge cases), and confirm schema file path.
