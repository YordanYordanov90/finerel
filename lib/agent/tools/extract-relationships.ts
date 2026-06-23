import { generateObject } from "ai";

import { models } from "@/lib/models";
import {
  extractionInputSchema,
  extractionOutputSchema,
  type ExtractionInput,
  type ExtractionOutput,
} from "@/lib/schemas/relationships";

const SYSTEM_PROMPT = `You are a financial relationship extraction engine. Your only job is to read
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
7. Prefer precision over recall. One high-confidence relationship is more valuable than five speculative ones.`;

export function buildExtractionPrompt(input: ExtractionInput): string {
  const tickerContext = input.focusTickers?.length
    ? `The user's watchlist tickers are: ${input.focusTickers.join(", ")}. Prioritize relationships involving these companies, but extract any clear relationship regardless of whether it involves a watchlist ticker.`
    : "";

  const articles = input.newsItems
    .map(
      (item, i) =>
        `[Article ${i + 1}]
ID: ${item.id}
Source: ${item.source}
Published: ${item.publishedAt}
Headline: ${item.headline}
Summary: ${item.summary}
URL: ${item.url}
Tickers mentioned: ${item.mentionedTickers.join(", ") || "none"}`,
    )
    .join("\n\n");

  return `${tickerContext}

Analyze the following ${input.newsItems.length} news articles and extract structured company relationships.

${articles}

Return all relationships found. If an article contains no clear relationship between named companies, skip it. Write the summary field as a 2–4 sentence plain-language briefing suitable for an email — name the most significant relationships found today.`;
}

function applyToolOverrides(
  object: ExtractionOutput,
  input: ExtractionInput,
): ExtractionOutput {
  const extractedAt = new Date().toISOString();

  return extractionOutputSchema.parse({
    ...object,
    userId: input.userId,
    itemsProcessed: input.newsItems.length,
    relationships: object.relationships.map((relationship) => ({
      ...relationship,
      extractedAt,
    })),
  });
}

function buildFallbackOutput(input: ExtractionInput): ExtractionOutput {
  return extractionOutputSchema.parse({
    relationships: [],
    summary: "No new relationships found today.",
    itemsProcessed: input.newsItems.length,
    userId: input.userId,
  });
}

export async function extractRelationships(
  rawInput: unknown,
): Promise<ExtractionOutput> {
  const input = extractionInputSchema.parse(rawInput);

  try {
    const { object } = await generateObject({
      model: models.extraction,
      schema: extractionOutputSchema,
      system: SYSTEM_PROMPT,
      prompt: buildExtractionPrompt(input),
    });

    return applyToolOverrides(object, input);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "unknown extraction error";

    console.error("[extract_relationships] failed", {
      userId: input.userId,
      itemCount: input.newsItems.length,
      error: message,
    });

    return buildFallbackOutput(input);
  }
}