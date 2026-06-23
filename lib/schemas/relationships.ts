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
  sourceUrl: z.string().url(),
  extractedAt: z.string(),
});

export const extractionOutputSchema = z.object({
  relationships: z.array(extractedRelationshipSchema),
  summary: z.string().max(500),
  itemsProcessed: z.number(),
  userId: z.string(),
});

export type ExtractionInput = z.infer<typeof extractionInputSchema>;
export type ExtractionOutput = z.infer<typeof extractionOutputSchema>;
export type ExtractedRelationship = z.infer<typeof extractedRelationshipSchema>;
export type RelationType = z.infer<typeof relationTypeSchema>;
export type ImpactLevel = z.infer<typeof impactLevelSchema>;