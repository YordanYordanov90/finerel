import { z } from "zod";

import { newsItemSchema, type NewsItem } from "@/lib/schemas/news";

export { newsItemSchema, type NewsItem };

export const extractionInputSchema = z.object({
  newsItems: z.array(newsItemSchema).min(1).max(50),
  focusTickers: z.array(z.string()).optional(),
  userId: z.string(),
});

export const relationTypeSchema = z.enum([
  "partnership",
  "supply_chain",
  "executive_mention",
  "product_collaboration",
  "investment",
]);

export const impactLevelSchema = z.enum(["high", "medium", "low"]);

export const extractedRelationshipSchema = z.object({
  sourceCompany: z.string(),
  sourceTicker: z.string().optional(),
  targetCompany: z.string(),
  targetTicker: z.string().optional(),
  relationType: relationTypeSchema,
  confidence: z.number().min(0).max(1),
  impactLevel: impactLevelSchema,
  contextSnippet: z.string().max(300),
  sourceNewsId: z.string(),
  // Plain string (not .url()): the model echoes the URL we supplied, and Zod's
  // .url() would force the tool to throw on the rare malformed echo. The model
  // never sources URLs independently, so format validation buys nothing here.
  sourceUrl: z.string(),
  extractedAt: z.string(),
});

export const extractionOutputSchema = z.object({
  relationships: z.array(extractedRelationshipSchema),
  summary: z.string().max(500),
  itemsProcessed: z.number(),
  userId: z.string(),
});

// Model-facing schema passed to generateObject. OpenAI's structured-output
// (strict) mode rejects string formats like `uri`, requires every property in
// `required` (so optional fields must be nullable, not absent), and does not
// honor min/max bounds. This schema is the strict-mode-clean shape; the tool
// sanitizes the result back into extractionOutputSchema (clamping confidence,
// truncating snippets, mapping null tickers to undefined).
export const extractionModelRelationshipSchema = z.object({
  sourceCompany: z.string(),
  sourceTicker: z.string().nullable(),
  targetCompany: z.string(),
  targetTicker: z.string().nullable(),
  relationType: relationTypeSchema,
  confidence: z.number().describe("Confidence from 0.0 to 1.0"),
  impactLevel: impactLevelSchema,
  contextSnippet: z
    .string()
    .describe("Direct quote from the source text, at most 300 characters"),
  sourceNewsId: z.string(),
  sourceUrl: z.string().describe("Source article URL, copied verbatim"),
});

export const extractionModelSchema = z.object({
  relationships: z.array(extractionModelRelationshipSchema),
  summary: z
    .string()
    .describe("2-4 sentence plain-language briefing for the email, max 500 chars"),
});

export type ExtractionInput = z.infer<typeof extractionInputSchema>;
export type ExtractionOutput = z.infer<typeof extractionOutputSchema>;
export type ExtractionModelOutput = z.infer<typeof extractionModelSchema>;
export type ExtractedRelationship = z.infer<typeof extractedRelationshipSchema>;
export type RelationType = z.infer<typeof relationTypeSchema>;
export type ImpactLevel = z.infer<typeof impactLevelSchema>;